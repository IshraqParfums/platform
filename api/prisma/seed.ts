import {
  PrismaClient,
  ProductStatus,
  ScentIntensity,
  ScentSillage,
  ScentLongevity,
  ProductGender,
  type Prisma,
} from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admins are intentionally NOT seeded here. `Admin.supabaseUserId` must
 * reference a real Supabase Auth user, and there's no offline way to mint one
 * from a Prisma seed script. Bootstrap one manually per api/README.md
 * ("Auth notes" → "Admin"): create the Supabase Auth user via the dashboard,
 * then insert the matching `admins` row.
 */

async function upsertCollection(input: {
  slug: string;
  name: string;
  description: string;
  editorialLabel?: string | null;
  homeRank?: number | null;
}) {
  return prisma.collection.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      editorialLabel: input.editorialLabel ?? null,
      homeRank: input.homeRank ?? null,
    },
    update: {
      name: input.name,
      description: input.description,
      editorialLabel: input.editorialLabel ?? null,
      homeRank: input.homeRank ?? null,
    },
  });
}

/** { notes: string[]; notesTranslation: string[] | null } — one tier of the
 *  fragrance notes pyramid. `notesTranslation` is left null throughout this
 *  seed (see `upsertProductWithDetails` doc comment). */
type NoteList = {
  notes: string[];
  notesTranslation: string[] | null;
};

/** Shape of `Product.notesPyramidJson`. */
type NotesPyramid = {
  opening: NoteList | null;
  heart: NoteList | null;
  base: NoteList | null;
};

/** Shape of `Product.meaningStoryJson`. */
type MeaningStory = {
  heading: string;
  body: string[];
  bodyTranslation: string[] | null;
};

/** One entry of `Product.faqJson`. */
type FaqItem = {
  question: string;
  answer: string;
};

async function upsertProductWithDetails(input: {
  slug: string;
  name: string;
  /** Urdu (Nastaliq) display name. Seeded values are placeholders — they read
   *  correctly but should be reviewed by a native speaker before launch. */
  nameUrdu?: string;
  collectionId: string;
  shortDescription: string;
  detailedDescription: string;
  variants: Array<{
    sizeMl: number;
    pricePaise: number;
    compareAtPricePaise?: number | null;
    stockQty: number;
  }>;
  imageUrl: string;
  imageAlt: string;

  // --- PDP content -------------------------------------------------------
  // Seeded values are placeholder-quality (not final client copy) but
  // structurally complete, so every product PDP section renders with
  // real-looking content. `*Translation`/`bodyTranslation`/`notesTranslation`
  // are left null throughout — we don't guess at Hindi/Urdu we can't verify.
  pronunciation: string;
  meaning: string;
  taglinePrimary: string;
  taglineTranslation: string;
  meaningStory: MeaningStory;
  notesPyramid: NotesPyramid;
  scentFamily: string;
  characterTags: string[];
  intensity: ScentIntensity;
  sillage: ScentSillage;
  longevity: ScentLongevity;
  season: string[];
  occasion: string[];
  gender: ProductGender;
  formatLabel: string;
  concentration: string;
  application: string;
  bottleDescription: string;
  howToUse: string[];
  care: string[];
  claims: string[];
  faq: FaqItem[];
}) {
  const pdpFields = {
    pronunciation: input.pronunciation,
    meaning: input.meaning,
    taglinePrimary: input.taglinePrimary,
    taglineTranslation: input.taglineTranslation,
    meaningStoryJson: input.meaningStory as unknown as Prisma.InputJsonValue,
    notesPyramidJson: input.notesPyramid as unknown as Prisma.InputJsonValue,
    scentFamily: input.scentFamily,
    characterTags: input.characterTags,
    intensity: input.intensity,
    sillage: input.sillage,
    longevity: input.longevity,
    season: input.season,
    occasion: input.occasion,
    gender: input.gender,
    formatLabel: input.formatLabel,
    concentration: input.concentration,
    application: input.application,
    bottleDescription: input.bottleDescription,
    howToUse: input.howToUse,
    care: input.care,
    claims: input.claims,
    faqJson: input.faq as unknown as Prisma.InputJsonValue,
  };

  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      nameUrdu: input.nameUrdu ?? null,
      collectionId: input.collectionId,
      shortDescription: input.shortDescription,
      detailedDescription: input.detailedDescription,
      status: ProductStatus.ACTIVE,
      ...pdpFields,
    },
    update: {
      name: input.name,
      nameUrdu: input.nameUrdu ?? null,
      collectionId: input.collectionId,
      shortDescription: input.shortDescription,
      detailedDescription: input.detailedDescription,
      status: ProductStatus.ACTIVE,
      ...pdpFields,
    },
  });

  for (const variant of input.variants) {
    const compareAtPricePaise = variant.compareAtPricePaise ?? null;

    await prisma.productVariant.upsert({
      where: {
        productId_sizeMl: {
          productId: product.id,
          sizeMl: variant.sizeMl,
        },
      },
      create: {
        productId: product.id,
        sizeMl: variant.sizeMl,
        pricePaise: variant.pricePaise,
        compareAtPricePaise,
        stockQty: variant.stockQty,
        isAvailable: true,
      },
      update: {
        pricePaise: variant.pricePaise,
        compareAtPricePaise,
        stockQty: variant.stockQty,
        isAvailable: true,
      },
    });
  }

  // storagePath stays null: these point at local `web/public/products/*.jpg`
  // assets (or, for the one product without generated art yet, a
  // placehold.co URL) rather than a real Supabase Storage object.
  // MediaService.remove() no-ops entirely when storagePath is falsy, so this
  // is the documented, sanctioned way to seed images with no Storage upload.
  const existingImage = await prisma.productImage.findFirst({
    where: { productId: product.id, displayOrder: 0 },
  });

  if (existingImage) {
    await prisma.productImage.update({
      where: { id: existingImage.id },
      data: {
        url: input.imageUrl,
        altText: input.imageAlt,
        storagePath: null,
      },
    });
  } else {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: input.imageUrl,
        altText: input.imageAlt,
        displayOrder: 0,
        storagePath: null,
      },
    });
  }

  return product;
}

async function main() {
  // homeRank 1–3 fill the homepage collections grid on a fresh clone.
  // Unranked collections remain browsable via /shop and /collections.
  const designer = await upsertCollection({
    slug: 'designer',
    name: 'Designer',
    description: 'Contemporary designer-inspired compositions.',
    editorialLabel: 'Designer-inspired',
    homeRank: 1,
  });

  const nostalgia = await upsertCollection({
    slug: 'nostalgia',
    name: 'Nostalgia',
    description: 'Memory-led scents with warm, familiar depth.',
    editorialLabel: 'Memory-led',
    homeRank: 2,
  });

  const limitedEdition = await upsertCollection({
    slug: 'limited-edition',
    name: 'Limited Edition',
    description:
      'Small-batch releases in strictly limited runs. Once a batch is gone, it is gone.',
    editorialLabel: 'Limited batches',
    homeRank: 3,
  });

  // --- Designer ---------------------------------------------------------
  await upsertProductWithDetails({
    slug: 'citrus-atelier',
    name: 'Citrus Atelier',
    nameUrdu: 'نکہتِ ترنج',
    collectionId: designer.id,
    shortDescription: 'Bright citrus over a clean, modern musk base.',
    detailedDescription:
      'Citrus Atelier is an airy, sunlit composition: sparkling top notes, a transparent floral heart, and a soft musk dry-down for all-day freshness.',
    variants: [
      {
        sizeMl: 30,
        pricePaise: 169900,
        compareAtPricePaise: 199900,
        stockQty: 30,
      },
      { sizeMl: 50, pricePaise: 269900, stockQty: 20 },
      { sizeMl: 100, pricePaise: 399900, stockQty: 18 },
    ],
    imageUrl: '/products/citrus-atelier.jpg',
    imageAlt: 'Citrus Atelier perfume bottle in golden mist',
    pronunciation: 'SIT-russ AT-uhl-yay',
    meaning: 'Citrus workshop',
    taglinePrimary: 'Sunlight, bottled.',
    taglineTranslation: 'دھوپ کی خوشبو',
    meaningStory: {
      heading: 'A workshop built on light',
      body: [
        "Citrus Atelier began as a study in brightness — how far a composition can lean into freshness without turning thin. The name borrows the idea of an atelier, a working studio, because that's what this scent feels like: citrus oils tested and retested until the balance felt right.",
        "It's the kind of fragrance you reach for on a morning that needs a lift — not loud, not complicated, just clean sunlight rendered as a scent.",
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Sicilian bergamot', 'Lemon peel', 'Mandarin'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Neroli', 'White petals', 'Green tea accord'],
        notesTranslation: null,
      },
      base: {
        notes: ['White musk', 'Soft cedar', 'Ambrette'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Citrus Aromatic',
    characterTags: ['Bright', 'Zesty', 'Clean', 'Uplifting'],
    intensity: ScentIntensity.LIGHT,
    sillage: ScentSillage.MODERATE,
    longevity: ScentLongevity.SHORT,
    season: ['Spring', 'Summer'],
    occasion: ['Daytime', 'Office'],
    gender: ProductGender.UNISEX,
    formatLabel: 'Eau de Parfum',
    concentration: '16% concentrate',
    application: 'Spray',
    bottleDescription: 'Clear glass flacon with a brushed-gold cap',
    howToUse: [
      'Spray from 15–20cm onto pulse points — wrists, neck, inner elbows.',
      'Apply to moisturised skin for better hold.',
      'Reapply lightly after a few hours if a stronger presence is wanted.',
      'Avoid rubbing wrists together after application.',
    ],
    care: [
      'Store upright, away from direct sunlight and heat.',
      'Keep the cap on tightly between uses to protect the top notes.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'No animal-derived materials'],
    faq: [
      {
        question: 'How long does Citrus Atelier last on skin?',
        answer:
          'Expect roughly 3–5 hours of close wear, typical of a bright citrus composition — reapply once through the day if you would like it to carry longer.',
      },
      {
        question: 'Is this fragrance suitable for daily office wear?',
        answer:
          "Yes — it's designed with a moderate sillage that reads as fresh and clean rather than loud, which makes it an easy daytime and workplace scent.",
      },
      {
        question: 'Does it work for both men and women?',
        answer:
          "Citrus Atelier is composed as a unisex fragrance — the citrus-musk balance isn't gendered by design.",
      },
    ],
  });

  await upsertProductWithDetails({
    slug: 'noir-velvet',
    name: 'Noir Velvet',
    nameUrdu: 'سیاہ مخمل',
    collectionId: designer.id,
    shortDescription: 'A dark, velvety amber-wood signature.',
    detailedDescription:
      'Noir Velvet opens with soft spice, settles into resinous amber, and finishes on smooth woods. Built for evening wear and lasting presence.',
    variants: [
      { sizeMl: 30, pricePaise: 189900, stockQty: 25 },
      { sizeMl: 50, pricePaise: 289900, stockQty: 16 },
      {
        sizeMl: 100,
        pricePaise: 449900,
        compareAtPricePaise: 529900,
        stockQty: 12,
      },
    ],
    imageUrl: '/products/noir-velvet.jpg',
    imageAlt: 'Noir Velvet perfume bottle in dark rose light',
    pronunciation: 'nwahr VEL-vit',
    meaning: 'Black velvet',
    taglinePrimary: 'رات کی مخملی خاموشی',
    taglineTranslation: 'The velvet hush of night.',
    meaningStory: {
      heading: 'What the dark holds',
      body: [
        "Noir Velvet takes its name literally: noir for the hour it's built for, velvet for the way it sits on skin — soft-edged, warm, without a single sharp note to interrupt it.",
        "It's a composition for after the sun is down — spice at the opening giving way to something resinous and slow, built to linger rather than announce itself.",
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Pink pepper', 'Cardamom', 'Bergamot'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Amber resin', 'Rose absolute', 'Incense'],
        notesTranslation: null,
      },
      base: {
        notes: ['Sandalwood', 'Dark musk', 'Tonka bean'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Woody Amber',
    characterTags: ['Dark', 'Sensual', 'Warm', 'Confident'],
    intensity: ScentIntensity.STRONG,
    sillage: ScentSillage.STRONG,
    longevity: ScentLongevity.LONG,
    season: ['Autumn', 'Winter'],
    occasion: ['Evening', 'Date Night'],
    gender: ProductGender.MASCULINE,
    formatLabel: 'Eau de Parfum',
    concentration: '20% concentrate',
    application: 'Spray',
    bottleDescription: 'Frosted black glass with a weighted matte-black cap',
    howToUse: [
      'Spray 2–3 times onto pulse points from a short distance.',
      'One or two sprays is usually enough given its strong projection.',
      'Best applied just before heading out for evening wear.',
      'Layer sparingly with an unscented body lotion to extend wear.',
    ],
    care: [
      'Store upright in a cool, dark place, away from bathroom humidity.',
      'Keep tightly capped to preserve the resinous base notes.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'Long-lasting formula'],
    faq: [
      {
        question: 'Is Noir Velvet too strong for daytime wear?',
        answer:
          "It's built with a strong sillage and is best suited to evening — for daytime, one light spray is enough to avoid overwhelming a room.",
      },
      {
        question: 'What does it smell like as it dries down?',
        answer:
          'The opening spice fades within the first hour into a warm amber-sandalwood base that carries for most of the wear time.',
      },
      {
        question: 'Will this work for a special occasion?',
        answer:
          'Yes — its strength and long-lasting formula make it a good pick for evenings out, dinners and events where you want to be remembered.',
      },
    ],
  });

  await upsertProductWithDetails({
    slug: 'cedar-sessions',
    name: 'Cedar Sessions',
    nameUrdu: 'دیودار کی محفل',
    collectionId: designer.id,
    shortDescription: 'Dry cedar, vetiver roots, and clean woodsmoke.',
    detailedDescription:
      'A woody signature with no sweetness to hide behind. Petitgrain and black pepper up top, cedarwood and Iso E Super through the heart, vetiver holding the base. Dry, composed and quietly confident.',
    variants: [
      { sizeMl: 30, pricePaise: 169900, stockQty: 30 },
      { sizeMl: 50, pricePaise: 249900, stockQty: 22 },
      {
        sizeMl: 100,
        pricePaise: 399900,
        compareAtPricePaise: 449900,
        stockQty: 14,
      },
    ],
    imageUrl: '/products/cedar-sessions.jpg',
    imageAlt: 'Cedar Sessions perfume bottle in amber woodsmoke',
    pronunciation: 'SEE-der SESH-uns',
    meaning: 'Wood, in the moment',
    taglinePrimary: 'Dry wood, held steady.',
    taglineTranslation: 'Composed, unhurried, wood to the bone.',
    meaningStory: {
      heading: 'No sweetness to hide behind',
      body: [
        'Cedar Sessions is named for exactly what it is — a session spent with raw materials, cedar chief among them, with nothing added to soften the edges. No vanilla, no sugar, no shortcut to likability.',
        "It's a composition that trusts dryness: pepper and petitgrain at the top, cedarwood carrying the middle, vetiver holding everything down. Quiet, composed, and confident enough not to need embellishment.",
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Black pepper', 'Petitgrain', 'Bergamot'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Cedarwood', 'Iso E Super', 'Cypress'],
        notesTranslation: null,
      },
      base: {
        notes: ['Vetiver', 'Dry amber', 'Oakmoss'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Woody Aromatic',
    characterTags: ['Dry', 'Composed', 'Grounded', 'Understated'],
    intensity: ScentIntensity.MODERATE,
    sillage: ScentSillage.MODERATE,
    longevity: ScentLongevity.LONG,
    season: ['Autumn', 'Winter'],
    occasion: ['Office', 'Everyday'],
    gender: ProductGender.MASCULINE,
    formatLabel: 'Eau de Parfum',
    concentration: '18% concentrate',
    application: 'Spray',
    bottleDescription: 'Clear glass, brushed-steel cap',
    howToUse: [
      'Spray from 15–20cm onto wrists, neck and chest.',
      'Two to three sprays is a natural amount for daily wear.',
      'Apply straight after a shower, while skin is still slightly damp.',
      'Reapply once past the midday mark if needed.',
    ],
    care: [
      'Keep upright, out of direct sunlight.',
      'Store below room temperature where possible to preserve the vetiver base.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'No animal-derived materials'],
    faq: [
      {
        question: 'Does Cedar Sessions have any sweetness to it?',
        answer:
          'No — it is deliberately built dry, with no vanilla or sugared notes. If you prefer sweeter woods, this one will read as more austere.',
      },
      {
        question: 'Is it office-appropriate?',
        answer:
          'Yes, its moderate sillage and dry, composed character make it one of our easiest picks for daily office wear.',
      },
      {
        question: 'How does it evolve over the day?',
        answer:
          'Pepper and petitgrain lift first, cedarwood and cypress settle in through the afternoon, and vetiver carries it into the evening.',
      },
    ],
  });

  // --- Nostalgia ----------------------------------------------------------
  await upsertProductWithDetails({
    slug: 'monsoon-letters',
    name: 'Monsoon Letters',
    nameUrdu: 'برسات کے خطوط',
    collectionId: nostalgia.id,
    shortDescription: 'Rain-soaked paper, tea, and soft woods.',
    detailedDescription:
      'Monsoon Letters captures wet earth after rain, warm tea steam, and the quiet of old letters — a nostalgic skin scent with gentle projection.',
    variants: [
      { sizeMl: 30, pricePaise: 179900, stockQty: 20 },
      { sizeMl: 50, pricePaise: 279900, stockQty: 14 },
      { sizeMl: 100, pricePaise: 429900, stockQty: 10 },
    ],
    imageUrl: '/products/monsoon-letters.jpg',
    imageAlt: 'Monsoon Letters perfume bottle in green rain mist',
    pronunciation: 'MON-soon LET-erz',
    meaning: 'Letters written in the rain',
    taglinePrimary: 'بارش کے بعد کی خوشبو',
    taglineTranslation: 'The scent that comes after rain.',
    meaningStory: {
      heading: 'The smell of a letter you kept',
      body: [
        "Monsoon Letters is built around a very specific memory: rain on warm ground, tea going cold on a windowsill, an old letter re-read for no particular reason. It isn't trying to be a grand fragrance — it's trying to be a familiar one.",
        'The composition stays close to skin on purpose. This is a scent meant to be discovered by someone standing near you, not announced across a room.',
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Petrichor accord', 'Bergamot', 'Green tea'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Wet paper accord', 'Fig leaf', 'Violet'],
        notesTranslation: null,
      },
      base: {
        notes: ['Soft woods', 'White musk', 'Amber'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Green Aromatic',
    characterTags: ['Nostalgic', 'Gentle', 'Earthy', 'Quiet'],
    intensity: ScentIntensity.LIGHT,
    sillage: ScentSillage.INTIMATE,
    longevity: ScentLongevity.MODERATE,
    season: ['Monsoon'],
    occasion: ['Everyday', 'Home'],
    gender: ProductGender.UNISEX,
    formatLabel: 'Eau de Parfum',
    concentration: '15% concentrate',
    application: 'Spray',
    bottleDescription: 'Sage-tinted glass with a natural cork cap',
    howToUse: [
      'Spray onto pulse points from a short distance.',
      'Works well applied to clothing as well as skin for a softer trail.',
      'Best experienced up close — this is a skin scent by design.',
      'Reapply through the day as needed; it fades gently rather than sitting heavy.',
    ],
    care: [
      'Store upright, away from humidity and direct light.',
      'Keep capped between uses to preserve the green top notes.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'Vegan formulation'],
    faq: [
      {
        question: 'Why does Monsoon Letters feel so close to the skin?',
        answer:
          'It is composed with an intimate sillage on purpose — a memory-led scent felt by you and whoever is near, not projected across a room.',
      },
      {
        question: 'Is this fragrance seasonal?',
        answer:
          'It is named for the monsoon and evokes rain-soaked memory, but the green-woody base wears comfortably in most weather.',
      },
      {
        question: 'Does it smell literally like rain?',
        answer:
          'It leans on a petrichor accord in the opening — the scent of rain on warm earth — before settling into paper and soft wood, so it evokes rather than replicates rain.',
      },
    ],
  });

  await upsertProductWithDetails({
    slug: 'attar-of-sundays',
    name: 'Attar of Sundays',
    nameUrdu: 'اتوار کا عطر',
    collectionId: nostalgia.id,
    shortDescription: 'Powdered rose, soft violet, and warm skin musk.',
    detailedDescription:
      'Built around the memory of a dressing table: classical rose, nostalgic violet powder, and a soft musk underneath. Gentle, close-wearing and unmistakably familiar even the first time you smell it.',
    variants: [
      { sizeMl: 30, pricePaise: 159900, stockQty: 28 },
      { sizeMl: 50, pricePaise: 239900, stockQty: 20 },
      {
        sizeMl: 100,
        pricePaise: 379900,
        compareAtPricePaise: 429900,
        stockQty: 15,
      },
    ],
    imageUrl: '/products/attar-of-sundays.jpg',
    imageAlt: 'Attar of Sundays perfume bottle in soft rose light',
    pronunciation: 'AT-tar of SUN-dayz',
    meaning: "A Sunday's fragrance",
    taglinePrimary: 'The scent of slow mornings.',
    taglineTranslation: 'اتوار کی خوشبو',
    meaningStory: {
      heading: 'A dressing table, remembered',
      body: [
        "Attar of Sundays is built around one image: a dressing table on a slow Sunday morning, rose and powder in the air before anyone else is awake. It's a fragrance about unhurried time, not about being anywhere in particular.",
        'Rose leads, violet powders it, and a soft musk sits underneath — close, familiar, the kind of scent that feels like it was already part of the room before you walked in.',
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Rose otto', 'Pink pepper'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Violet', 'Iris powder', 'Geranium'],
        notesTranslation: null,
      },
      base: {
        notes: ['White musk', 'Sandalwood'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Powdery Floral',
    characterTags: ['Nostalgic', 'Soft', 'Powdery', 'Familiar'],
    intensity: ScentIntensity.MODERATE,
    sillage: ScentSillage.INTIMATE,
    longevity: ScentLongevity.MODERATE,
    season: ['Spring', 'Autumn'],
    occasion: ['Daytime', 'Casual'],
    gender: ProductGender.FEMININE,
    formatLabel: 'Attar / Concentrated Perfume Oil',
    concentration: 'Pure oil concentrate, alcohol-free',
    application: 'Roll-on',
    bottleDescription: 'Small rose-tinted glass vial with a rollerball fitment',
    howToUse: [
      'Roll onto pulse points — wrists, behind the ears, inner elbows.',
      'A little goes further than a spray format; start with one pass per point.',
      'Let it warm on skin for a few minutes before judging the scent.',
      'Reapply as needed since oil-based attars sit close to the skin.',
    ],
    care: [
      'Store upright in a cool, dark place — attars are more heat-sensitive than alcohol-based sprays.',
      'Keep the rollerball cap tightly closed to prevent evaporation.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'Alcohol-free'],
    faq: [
      {
        question: "What's the difference between an attar and a regular perfume?",
        answer:
          'Attar of Sundays is a pure oil concentrate with no alcohol base, applied by roll-on rather than spray — it sits closer to the skin and tends to feel warmer over time.',
      },
      {
        question: 'How long does the oil format last?',
        answer:
          'Expect several hours of intimate, close wear; because it is oil-based rather than alcohol-based, it does not project as far but tends to linger faithfully on skin.',
      },
      {
        question: 'Can this be layered with other fragrances?',
        answer:
          'Yes — its powdery rose base layers well under a lighter citrus or green scent if you want to build something more complex.',
      },
    ],
  });

  await upsertProductWithDetails({
    slug: 'amber-meridian',
    name: 'Amber Meridian',
    nameUrdu: 'عنبرِ نیم روز',
    collectionId: nostalgia.id,
    shortDescription: 'Golden amber, warm resin, and a slow-burning sweetness.',
    detailedDescription:
      'Amber Meridian opens on bright cardamom and pink pepper before settling into labdanum resin and benzoin, honeyed and unhurried. Built for cool evenings and long conversations.',
    variants: [
      {
        sizeMl: 30,
        pricePaise: 179900,
        compareAtPricePaise: 219900,
        stockQty: 26,
      },
      { sizeMl: 50, pricePaise: 269900, stockQty: 18 },
      { sizeMl: 100, pricePaise: 429900, stockQty: 12 },
    ],
    imageUrl: '/products/amber-meridian.jpg',
    imageAlt: 'Amber Meridian perfume bottle backlit in golden mist',
    pronunciation: 'AM-ber muh-RID-ee-un',
    meaning: 'Amber at high noon',
    taglinePrimary: 'Gold at its slowest hour.',
    taglineTranslation: 'سنہری دوپہر',
    meaningStory: {
      heading: 'The hour the light turns gold',
      body: [
        'Amber Meridian is named for the meridian line — the point where the day is at its fullest — reimagined as a scent rather than a time. It is warm without being heavy, sweet without tipping into dessert.',
        'Cardamom and pink pepper open it brightly before labdanum and benzoin take over, honeyed and unhurried. Built less for any one moment than for the long stretch of an evening that is in no rush to end.',
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Cardamom', 'Pink pepper', 'Bergamot'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Labdanum', 'Benzoin', 'Cinnamon'],
        notesTranslation: null,
      },
      base: {
        notes: ['Amber', 'Vanilla', 'Soft musk'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Oriental Amber',
    characterTags: ['Warm', 'Golden', 'Unhurried', 'Inviting'],
    intensity: ScentIntensity.MODERATE,
    sillage: ScentSillage.MODERATE,
    longevity: ScentLongevity.LONG,
    season: ['Autumn', 'Winter'],
    occasion: ['Evening', 'Gatherings'],
    gender: ProductGender.UNISEX,
    formatLabel: 'Eau de Parfum',
    concentration: '19% concentrate',
    application: 'Spray',
    bottleDescription: 'Amber glass bottle with a brass-finish cap',
    howToUse: [
      'Spray from 15–20cm onto pulse points.',
      "Two sprays is typically enough for a full evening's wear.",
      'Apply before dressing to let the top notes settle first.',
      'Reapply lightly if you want the amber base to carry into late evening.',
    ],
    care: [
      'Store upright, away from direct sunlight.',
      'Keep the cap closed between uses to protect the resin notes from oxidising.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'No animal-derived materials'],
    faq: [
      {
        question: 'Is Amber Meridian sweet?',
        answer:
          'It is warm and honeyed from the labdanum and benzoin, but it is balanced with spice rather than being an overtly sweet or dessert-like amber.',
      },
      {
        question: 'What time of day does it suit best?',
        answer:
          'It is built for the golden-hour-into-evening stretch — it wears well from late afternoon through a night out.',
      },
      {
        question: 'Does it work well in warmer climates?',
        answer:
          'It is a fuller-bodied amber, so it is most comfortable in cooler weather; it can feel heavy in peak summer heat.',
      },
    ],
  });

  // --- Limited Edition ------------------------------------------------
  await upsertProductWithDetails({
    slug: 'oud-ishraq',
    name: 'Oud Ishraq',
    nameUrdu: 'عودِ اشراق',
    collectionId: limitedEdition.id,
    shortDescription: 'Smoky oud, saffron leather, and dark resin.',
    detailedDescription:
      'Our most concentrated composition — a smoky, animalic oud base lifted by spiced suede and a thread of frankincense. Made in strictly limited batches; when a batch is gone, it is gone.',
    variants: [
      { sizeMl: 30, pricePaise: 349900, stockQty: 12 },
      { sizeMl: 50, pricePaise: 549900, stockQty: 8 },
      {
        sizeMl: 100,
        pricePaise: 899900,
        compareAtPricePaise: 999900,
        stockQty: 5,
      },
    ],
    imageUrl: '/products/oud-ishraq.jpg',
    imageAlt: 'Oud Ishraq perfume bottle in deep red smoke',
    pronunciation: 'ood ish-RAAK',
    meaning: 'Oud of the dawn light',
    taglinePrimary: 'اشراق کی روشنی',
    taglineTranslation: 'Radiance, before the world wakes.',
    meaningStory: {
      heading: 'The light before sunrise',
      body: [
        'Ishraq means radiance — the particular light of early morning, just before the sun fully clears the horizon. Pairing it with oud is deliberate: our most concentrated, most serious composition, named for a moment of quiet brilliance rather than volume.',
        'It opens smoky and animalic, a genuine oud base, before spiced suede and a thread of frankincense lift it toward something closer to warmth than darkness. Made in strictly limited batches — when a batch is gone, it is gone.',
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Smoked oud', 'Saffron', 'Black pepper'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Spiced suede', 'Frankincense', 'Rose'],
        notesTranslation: null,
      },
      base: {
        notes: ['Dark resin', 'Agarwood', 'Musk'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Oriental Woody',
    characterTags: ['Smoky', 'Radiant', 'Intense', 'Rare'],
    intensity: ScentIntensity.STRONG,
    sillage: ScentSillage.STRONG,
    longevity: ScentLongevity.VERY_LONG,
    season: ['Winter', 'Autumn'],
    occasion: ['Evening', 'Special Occasions'],
    gender: ProductGender.MASCULINE,
    formatLabel: 'Extrait de Parfum',
    concentration: '28% concentrate',
    application: 'Spray',
    bottleDescription: 'Deep red glass with a weighted brass cap',
    howToUse: [
      'One spray to a pulse point is typically enough given its concentration.',
      'Apply to clothing as well as skin for a longer-lasting trail.',
      'Best reserved for evenings and occasions where a strong presence is wanted.',
      'Allow a few minutes for the smoky opening to settle before judging the scent.',
    ],
    care: [
      'Store upright, away from heat and direct light — extrait concentrations are sensitive to temperature swings.',
      'Keep tightly capped; a small amount of air exposure can shift the smoky top notes over time.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'Limited release'],
    faq: [
      {
        question: "What does 'Ishraq' mean?",
        answer:
          'Ishraq is an Arabic and Urdu word for radiance — specifically the light of early morning just before sunrise, which is the mood this composition is built around.',
      },
      {
        question: 'How concentrated is Oud Ishraq compared to your other fragrances?',
        answer:
          'It is our strongest formulation at 28% concentrate, an extrait de parfum, so a single spray goes considerably further than our eau de parfum releases.',
      },
      {
        question: 'Will this batch be restocked once it sells out?',
        answer:
          'No — Oud Ishraq is released in strictly limited batches and is not guaranteed to be remade once a batch is sold out.',
      },
    ],
  });

  await upsertProductWithDetails({
    slug: 'smoke-and-saffron',
    name: 'Smoke & Saffron',
    nameUrdu: 'دھواں و زعفران',
    collectionId: limitedEdition.id,
    shortDescription: 'Saffron, ember-warm spice, and dry amber.',
    detailedDescription:
      'Saffron and cinnamon bark over a base of labdanum, with a whisper of campfire smoke. Warm, resinous and faintly edible without ever turning sweet.',
    variants: [
      { sizeMl: 30, pricePaise: 299900, stockQty: 14 },
      { sizeMl: 50, pricePaise: 449900, stockQty: 10 },
      {
        sizeMl: 100,
        pricePaise: 749900,
        compareAtPricePaise: 849900,
        stockQty: 6,
      },
    ],
    imageUrl: '/products/smoke-and-saffron.jpg',
    imageAlt: 'Smoke and Saffron perfume bottle in ember light',
    pronunciation: 'smohk and SAF-run',
    meaning: 'Ember and spice',
    taglinePrimary: 'Ember and gold, side by side.',
    taglineTranslation: 'دھواں اور زعفران',
    meaningStory: {
      heading: 'Warm without turning sweet',
      body: [
        'Smoke & Saffron sits right at the edge of edible without ever crossing it — saffron and cinnamon bark warmed over a base of labdanum, with just a whisper of campfire smoke threaded through.',
        'It is a composition built for cooler months and low light: resinous, a little smoky, closer to sitting near a fire than to a bakery. Part of the same limited-batch philosophy as the rest of this collection.',
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Saffron', 'Cinnamon bark', 'Cardamom'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Labdanum', 'Campfire smoke accord', 'Clove'],
        notesTranslation: null,
      },
      base: {
        notes: ['Dry amber', 'Guaiac wood', 'Musk'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Spicy Woody',
    characterTags: ['Smoky', 'Spiced', 'Resinous', 'Warm'],
    intensity: ScentIntensity.STRONG,
    sillage: ScentSillage.MODERATE,
    longevity: ScentLongevity.LONG,
    season: ['Autumn', 'Winter'],
    occasion: ['Evening', 'Festive'],
    gender: ProductGender.UNISEX,
    formatLabel: 'Eau de Parfum',
    concentration: '22% concentrate',
    application: 'Spray',
    bottleDescription: 'Smoked-glass bottle with a copper-toned cap',
    howToUse: [
      'Spray from 15–20cm onto pulse points.',
      'Two sprays is a good starting point given its strength.',
      'Layering onto a scarf or collar carries the smoke accord well through the evening.',
      'Reapply sparingly — it builds rather than fading flat.',
    ],
    care: [
      'Store upright, away from direct sunlight and heat sources.',
      'Keep tightly capped between uses to preserve the smoke and spice top notes.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'Limited release'],
    faq: [
      {
        question: 'Does Smoke & Saffron smell like food?',
        answer:
          'It flirts with edible warmth through the saffron and cinnamon, but the smoke accord and dry amber base keep it from ever turning into a gourmand.',
      },
      {
        question: 'Is this a good gift for someone who likes warm, spiced scents?',
        answer:
          'Yes — it is one of our warmest, most resinous fragrances and suits anyone who gravitates toward spice-forward, cooler-weather perfumes.',
      },
      {
        question: 'How does the smoke note come across — literal or subtle?',
        answer:
          'It is a whisper rather than a dominant note — present in the heart of the composition but balanced against saffron and labdanum, not overpowering.',
      },
    ],
  });

  // TODO: swap for real generated photography once available — every other
  // product in this seed uses the real bottle renders committed at
  // web/public/products/; this is the one exception.
  await upsertProductWithDetails({
    slug: 'velvet-reserve',
    name: 'Velvet Reserve',
    nameUrdu: 'مخملی ذخیرہ',
    collectionId: limitedEdition.id,
    shortDescription: 'A rare, velvet-dark signature reserved for collectors.',
    detailedDescription:
      'Velvet Reserve rounds out the Limited Edition line: patchouli and dark musk over a base of vetiver and ambrette, deep and slow to fade.',
    variants: [
      { sizeMl: 30, pricePaise: 269900, stockQty: 10 },
      { sizeMl: 50, pricePaise: 399900, stockQty: 7 },
      { sizeMl: 100, pricePaise: 649900, stockQty: 4 },
    ],
    imageUrl: 'https://placehold.co/800x1000/1a0f08/e8cb93?text=Velvet+Reserve',
    imageAlt: 'Velvet Reserve placeholder',
    pronunciation: 'VEL-vit ri-ZERV',
    meaning: 'Held back, kept dark',
    taglinePrimary: 'Kept for those who wait.',
    taglineTranslation: 'Reserved. Quietly, deliberately.',
    meaningStory: {
      heading: 'The last word in the collection',
      body: [
        'Velvet Reserve closes out the Limited Edition line the way a reserve bottling should — patchouli and dark musk laid over vetiver and ambrette, deep, unhurried, and slow to let go.',
        'The name is literal: this is the one we held back, released only in small numbers, meant for whoever is patient enough to seek it out rather than whoever finds it first.',
      ],
      bodyTranslation: null,
    },
    notesPyramid: {
      opening: {
        notes: ['Dark plum', 'Bergamot'],
        notesTranslation: null,
      },
      heart: {
        notes: ['Patchouli', 'Rose', 'Ambrette'],
        notesTranslation: null,
      },
      base: {
        notes: ['Vetiver', 'Dark musk', 'Oakmoss'],
        notesTranslation: null,
      },
    },
    scentFamily: 'Chypre Woody',
    characterTags: ['Deep', 'Mysterious', 'Slow-burning', 'Rare'],
    intensity: ScentIntensity.STRONG,
    sillage: ScentSillage.MODERATE,
    longevity: ScentLongevity.VERY_LONG,
    season: ['Winter'],
    occasion: ['Evening', 'Formal'],
    gender: ProductGender.FEMININE,
    formatLabel: 'Eau de Parfum',
    concentration: '20% concentrate',
    application: 'Spray',
    bottleDescription: 'Deep plum glass presented in a velvet-finish box',
    howToUse: [
      'Spray from 15–20cm onto pulse points.',
      'One to two sprays is enough given its strength and longevity.',
      'Apply ahead of dressing to let the plum top notes settle first.',
      'Best saved for evenings and occasions that call for something considered.',
    ],
    care: [
      'Store upright, away from direct light and heat.',
      'Keep the box and cap closed between uses — this release is not restocked once sold out.',
    ],
    claims: ['Small-batch', 'IFRA compliant', 'Limited release'],
    faq: [
      {
        question: "Why is it called 'Reserve'?",
        answer:
          "It closes out the Limited Edition line and is released in especially small numbers — 'reserve' reflects both the scarcity and the deep, held-back character of the composition.",
      },
      {
        question: 'How long does Velvet Reserve last on skin?',
        answer:
          'It is one of our longest-wearing fragrances — the vetiver and dark musk base is designed to carry well into the following day on fabric.',
      },
      {
        question: 'Will there be a real product photo for this listing?',
        answer:
          'Not yet — Velvet Reserve currently uses a placeholder image while photography is finalised; the listing itself is fully live.',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
