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
 *  fragrance notes pyramid. English notes plus optional Urdu names. */
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
  variants: Array<{
    sizeMl: number;
    pricePaise: number;
    compareAtPricePaise?: number | null;
    stockQty: number;
  }>;
  images: Array<{ url: string; alt: string }>;

  // --- PDP content -------------------------------------------------------
  // Seeded values are placeholder-quality (not final client copy) but
  // structurally complete, so every product PDP section renders with
  // real-looking content. Translation fields are Urdu (Nastaliq) placeholders.
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
      status: ProductStatus.ACTIVE,
      ...pdpFields,
    },
    update: {
      name: input.name,
      nameUrdu: input.nameUrdu ?? null,
      collectionId: input.collectionId,
      shortDescription: input.shortDescription,
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

  // Local files in `web/public/products/*.webp`. storagePath stays null so
  // MediaService.remove() no-ops — the documented way to seed without Storage.
  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.createMany({
    data: input.images.map((image, index) => ({
      productId: product.id,
      url: image.url,
      altText: image.alt,
      displayOrder: index,
      storagePath: null,
    })),
  });

  return product;
}

const SEED_REVIEWER_PHONES = Array.from(
  { length: 10 },
  (_, index) => `+9190000000${String(index + 1).padStart(2, '0')}`,
);

const SEED_REVIEWER_NAMES = [
  'Aarav Mehta',
  'Zara Khan',
  'Kabir Iyer',
  'Meher Qureshi',
  'Rohan Desai',
  'Ananya Shah',
  'Vivaan Patel',
  'Sara Hussain',
  'Ishaan Nair',
  'Noor Rahman',
] as const;

const SEED_REVIEW_BODIES = [
  'Wears close and stays. I keep catching it on my sleeve the next morning.',
  'The opening is louder than the drydown, which is how I like it.',
  'Not sweet. Dry, a little smoky, very easy to live in.',
  'Sprayed twice and it filled the room — next time I will go lighter.',
  'This is the one I reach for when I do not want to think.',
  null,
  'Lasts through a long dinner without turning sour.',
  null,
  'People asked what I was wearing, which almost never happens.',
  'Quiet on me at first, then the woods come up after an hour.',
] as const;

async function seedDemoReviews(counts: Record<string, number>) {
  const customers = [];
  for (let i = 0; i < SEED_REVIEWER_PHONES.length; i++) {
    const phone = SEED_REVIEWER_PHONES[i];
    const customer = await prisma.customer.upsert({
      where: { phone },
      create: {
        phone,
        name: SEED_REVIEWER_NAMES[i],
        email: `seed.reviewer.${i + 1}@ishraq.local`,
      },
      update: { name: SEED_REVIEWER_NAMES[i] },
    });
    customers.push(customer);
  }

  await prisma.review.deleteMany({
    where: { customerId: { in: customers.map((c) => c.id) } },
  });

  const ratings = [5, 4, 5, 3, 5, 4, 5, 4, 5, 3];

  for (const [slug, count] of Object.entries(counts)) {
    if (count === 0) continue;
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      throw new Error(`Seed review: missing product ${slug}`);
    }
    for (let i = 0; i < count; i++) {
      await prisma.review.create({
        data: {
          customerId: customers[i].id,
          productId: product.id,
          rating: ratings[i],
          body: SEED_REVIEW_BODIES[i],
        },
      });
    }
  }
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
    images: [
      {
        url: '/products/citrus-atelier.webp',
        alt: 'Bergamot, lemon peel, and white petals on linen',
      },
    ],
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
      bodyTranslation: [
        'نکہتِ ترنج روشنی کے مطالعے سے شروع ہوا — تازگی کو اس حد تک لے جانا کہ وہ پتلی نہ لگے۔ نام اٹیلیے سے آیا ہے، ایک کام کرنے والی ورکشاپ، کیونکہ یہ خوشبو ویسی ہی ہے: کھٹی تیل بار بار آزمائی گئیں جب تک توازن ٹھیک نہ لگا۔',
        'یہ وہ خوشبو ہے جو ایسے صبح کے لیے ہے جسے اٹھان چاہیے — نہ شور، نہ پیچیدگی، صرف صاف دھوپ جو خوشبو بن گئی۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Sicilian bergamot', 'Lemon peel', 'Mandarin'],
        notesTranslation: ['برگاموٹ', 'لیموں کا چھلکا', 'سنترہ'],
      },
      heart: {
        notes: ['Neroli', 'White petals', 'Green tea accord'],
        notesTranslation: ['نرولی', 'سفید پنکھڑیاں', 'سبز چائے'],
      },
      base: {
        notes: ['White musk', 'Soft cedar', 'Ambrette'],
        notesTranslation: ['سفید مشک', 'نرم دیودار', 'امبریٹ'],
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
    images: [
      {
        url: '/products/noir-velvet.webp',
        alt: 'Pink pepper, amber resin, and rose on dark linen',
      },
    ],
    pronunciation: 'nwahr VEL-vit',
    meaning: 'Black velvet',
    taglinePrimary: 'The velvet hush of night.',
    taglineTranslation: 'رات کی مخملی خاموشی',
    meaningStory: {
      heading: 'What the dark holds',
      body: [
        "Noir Velvet takes its name literally: noir for the hour it's built for, velvet for the way it sits on skin — soft-edged, warm, without a single sharp note to interrupt it.",
        "It's a composition for after the sun is down — spice at the opening giving way to something resinous and slow, built to linger rather than announce itself.",
      ],
      bodyTranslation: [
        'سیاہ مخمل کا نام لفظی ہے: نوآر اس گھڑی کے لیے جس کے لیے یہ بنایا گیا، مخمل اس انداز کے لیے جس سے یہ جلد پر بیٹھتا ہے — نرم کنارے، گرم، بغیر کسی تیز نوٹ کے جو اسے توڑ دے۔',
        'یہ سورج ڈھلنے کے بعد کی ترکیب ہے — شروع میں مصالحہ، پھر رال اور سست گرمی، جو اعلان کرنے کے بجائے ٹھہر جاتی ہے۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Pink pepper', 'Cardamom', 'Bergamot'],
        notesTranslation: ['گل مرچ', 'الائچی', 'برگاموٹ'],
      },
      heart: {
        notes: ['Amber resin', 'Rose absolute', 'Incense'],
        notesTranslation: ['عنبر رال', 'گلاب', 'لوبان'],
      },
      base: {
        notes: ['Sandalwood', 'Dark musk', 'Tonka bean'],
        notesTranslation: ['چندن', 'سیاہ مشک', 'ٹونکا'],
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
    images: [
      {
        url: '/products/cedar-sessions.webp',
        alt: 'Cedar shavings, vetiver roots, and clean woodsmoke',
      },
    ],
    pronunciation: 'SEE-der SESH-uns',
    meaning: 'Wood, in the moment',
    taglinePrimary: 'Dry wood, held steady.',
    taglineTranslation: 'خشک لکڑی، سیدھی اور سنجیدہ۔',
    meaningStory: {
      heading: 'No sweetness to hide behind',
      body: [
        'Cedar Sessions is named for exactly what it is — a session spent with raw materials, cedar chief among them, with nothing added to soften the edges. No vanilla, no sugar, no shortcut to likability.',
        "It's a composition that trusts dryness: pepper and petitgrain at the top, cedarwood carrying the middle, vetiver holding everything down. Quiet, composed, and confident enough not to need embellishment.",
      ],
      bodyTranslation: [
        'دیودار کی محفل کا نام وہی ہے جو یہ ہے — خام مواد کے ساتھ ایک نشست، سب سے پہلے دیودار، بغیر کسی چیز کے جو کنارے نرم کر دے۔ نہ ونیلا، نہ شکر، نہ پسندیدگی کا شارٹ کٹ۔',
        'یہ خشکی پر بھروسہ کرتی ہے: اوپر مرچ اور پیٹیگرین، درمیان میں دیودار، نیچے ویٹیور۔ خاموش، سنجیدہ، اور اتنی پُراعتماد کہ سجاوٹ کی ضرورت نہیں۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Black pepper', 'Petitgrain', 'Bergamot'],
        notesTranslation: ['کالی مرچ', 'پیٹیگرین', 'برگاموٹ'],
      },
      heart: {
        notes: ['Cedarwood', 'Iso E Super', 'Cypress'],
        notesTranslation: ['دیودار', 'آئسو ای', 'سرو'],
      },
      base: {
        notes: ['Vetiver', 'Dry amber', 'Oakmoss'],
        notesTranslation: ['ویٹیور', 'خشک عنبر', 'اوک ماس'],
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
    variants: [
      { sizeMl: 30, pricePaise: 179900, stockQty: 20 },
      { sizeMl: 50, pricePaise: 279900, stockQty: 14 },
      { sizeMl: 100, pricePaise: 429900, stockQty: 10 },
    ],
    images: [
      {
        url: '/products/monsoon-letters.webp',
        alt: 'Rain-soaked paper, tea, and wet wood',
      },
    ],
    pronunciation: 'MON-soon LET-erz',
    meaning: 'Letters written in the rain',
    taglinePrimary: 'The scent that comes after rain.',
    taglineTranslation: 'بارش کے بعد کی خوشبو',
    meaningStory: {
      heading: 'The smell of a letter you kept',
      body: [
        "Monsoon Letters is built around a very specific memory: rain on warm ground, tea going cold on a windowsill, an old letter re-read for no particular reason. It isn't trying to be a grand fragrance — it's trying to be a familiar one.",
        'The composition stays close to skin on purpose. This is a scent meant to be discovered by someone standing near you, not announced across a room.',
      ],
      bodyTranslation: [
        'برسات کے خطوط ایک خاص یاد کے گرد بنائے گئے: گرم زمین پر بارش، کھڑکی پر ٹھنڈی ہوتی چائے، ایک پرانا خط بغیر کسی وجہ کے دوبارہ پڑھا ہوا۔ یہ بڑی خوشبو بننے کی کوشش نہیں — مانوس ہونے کی کوشش ہے۔',
        'ترکیب جان بوجھ کر جلد کے قریب رہتی ہے۔ یہ وہ خوشبو ہے جو پاس کھڑے کسی کو معلوم ہو، کمرے کے اس پار اعلان نہ ہو۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Petrichor accord', 'Bergamot', 'Green tea'],
        notesTranslation: ['مٹی کی خوشبو', 'برگاموٹ', 'سبز چائے'],
      },
      heart: {
        notes: ['Wet paper accord', 'Fig leaf', 'Violet'],
        notesTranslation: ['گیلا کاغذ', 'انجیر کا پتہ', 'بنفشہ'],
      },
      base: {
        notes: ['Soft woods', 'White musk', 'Amber'],
        notesTranslation: ['نرم لکڑیاں', 'سفید مشک', 'عنبر'],
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
    images: [
      {
        url: '/products/attar-of-sundays.webp',
        alt: 'Powdered rose petals and violet on a brass tray',
      },
    ],
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
      bodyTranslation: [
        'اتوار کا عطر ایک تصویر کے گرد ہے: اتوار کی سست صبح، کوئی جاگا نہیں، میز پر گلاب اور پاؤڈر کی ہوا۔ یہ بے تابی کی خوشبو نہیں — بے جلدی وقت کی ہے۔',
        'گلاب آگے ہے، بنفشہ اسے پاؤڈر کرتا ہے، اور نیچے نرم مشک — قریب، مانوس، جیسی خوشبو کمرے میں تم سے پہلے سے تھی۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Rose otto', 'Pink pepper'],
        notesTranslation: ['گلاب اٹو', 'گل مرچ'],
      },
      heart: {
        notes: ['Violet', 'Iris powder', 'Geranium'],
        notesTranslation: ['بنفشہ', 'آئرس', 'جیرانیم'],
      },
      base: {
        notes: ['White musk', 'Sandalwood'],
        notesTranslation: ['سفید مشک', 'چندن'],
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
    images: [
      {
        url: '/products/amber-meridian.webp',
        alt: 'Golden amber resin, cardamom, and benzoin in noon light',
      },
    ],
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
      bodyTranslation: [
        'عنبرِ نیم روز نصف النہار کی لکیر کے نام پر ہے — دن کی سب سے بھری گھڑی — وقت نہیں، خوشبو۔ گرم ہے مگر بھاری نہیں، میٹھی ہے مگر میٹھی ڈش نہیں بنتی۔',
        'الائچی اور گل مرچ اسے روشن کھولتی ہیں، پھر لبدانم اور بینزوائن سنہری اور بے جلدی لے لیتے ہیں۔ کسی ایک لمحے کے لیے نہیں، ایک لمبی شام کے لیے جو ختم ہونے کو جلدی نہیں۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Cardamom', 'Pink pepper', 'Bergamot'],
        notesTranslation: ['الائچی', 'گل مرچ', 'برگاموٹ'],
      },
      heart: {
        notes: ['Labdanum', 'Benzoin', 'Cinnamon'],
        notesTranslation: ['لبدانم', 'بینزوائن', 'دارچینی'],
      },
      base: {
        notes: ['Amber', 'Vanilla', 'Soft musk'],
        notesTranslation: ['عنبر', 'ونیلا', 'نرم مشک'],
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
    images: [
      {
        url: '/products/oud-ishraq-1.webp',
        alt: 'Agarwood chips, saffron, and dark resin',
      },
      {
        url: '/products/oud-ishraq-2.webp',
        alt: 'Frankincense, spiced suede, and dried rose',
      },
    ],
    pronunciation: 'ood ish-RAAK',
    meaning: 'Oud of the dawn light',
    taglinePrimary: 'Radiance, before the world wakes.',
    taglineTranslation: 'اشراق کی روشنی',
    meaningStory: {
      heading: 'The light before sunrise',
      body: [
        'Ishraq means radiance — the particular light of early morning, just before the sun fully clears the horizon. Pairing it with oud is deliberate: our most concentrated, most serious composition, named for a moment of quiet brilliance rather than volume.',
        'It opens smoky and animalic, a genuine oud base, before spiced suede and a thread of frankincense lift it toward something closer to warmth than darkness. Made in strictly limited batches — when a batch is gone, it is gone.',
      ],
      bodyTranslation: [
        'اشراق کا مطلب چمک ہے — وہ خاص روشنی جو سورج افق سے پہلے آتی ہے۔ اسے عود کے ساتھ جوڑنا جان بوجھ کر ہے: ہماری سب سے گہری، سنجیدہ ترکیب، شور کے بجائے خاموش چمک کے نام پر۔',
        'شروع میں دھواں اور حیوانی عود، پھر مصالحہ سوئڈ اور لوبان کی ایک لکیڑ اسے اندھیرے سے زیادہ گرمی کی طرف اٹھاتی ہے۔ محدود بیچ — بیچ ختم تو ختم۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Smoked oud', 'Saffron', 'Black pepper'],
        notesTranslation: ['دھواں دار عود', 'زعفران', 'کالی مرچ'],
      },
      heart: {
        notes: ['Spiced suede', 'Frankincense', 'Rose'],
        notesTranslation: ['مصالحہ سوئڈ', 'لوبان', 'گلاب'],
      },
      base: {
        notes: ['Dark resin', 'Agarwood', 'Musk'],
        notesTranslation: ['گہری رال', 'اگر', 'مشک'],
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
    images: [
      {
        url: '/products/smoke-and-saffron-1.webp',
        alt: 'Saffron threads, cinnamon bark, and cardamom',
      },
      {
        url: '/products/smoke-and-saffron-2.webp',
        alt: 'Labdanum, clove, and dry amber resin',
      },
    ],
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
      bodyTranslation: [
        'دھواں و زعفران کھانے کی حد کے بالکل کنارے پر ہے مگر پار نہیں جاتا — زعفران اور دارچینی کی چھال، لبدانم کے اوپر گرم، اور آگ کے دھوئیں کی ایک سرگوشی۔',
        'ٹھنڈے مہینوں اور کم روشنی کے لیے: رال، تھوڑا دھواں، بیکری سے زیادہ آگ کے پاس بیٹھنے جیسا۔ اسی محدود بیچ کے فلسفے کا حصہ۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Saffron', 'Cinnamon bark', 'Cardamom'],
        notesTranslation: ['زعفران', 'دارچینی کی چھال', 'الائچی'],
      },
      heart: {
        notes: ['Labdanum', 'Campfire smoke accord', 'Clove'],
        notesTranslation: ['لبدانم', 'آگ کا دھواں', 'لونگ'],
      },
      base: {
        notes: ['Dry amber', 'Guaiac wood', 'Musk'],
        notesTranslation: ['خشک عنبر', 'گائیک لکڑی', 'مشک'],
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

  await upsertProductWithDetails({
    slug: 'velvet-reserve',
    name: 'Velvet Reserve',
    nameUrdu: 'مخملی ذخیرہ',
    collectionId: limitedEdition.id,
    shortDescription: 'A rare, velvet-dark signature reserved for collectors.',
    variants: [
      { sizeMl: 30, pricePaise: 269900, stockQty: 10 },
      { sizeMl: 50, pricePaise: 399900, stockQty: 7 },
      { sizeMl: 100, pricePaise: 649900, stockQty: 4 },
    ],
    images: [
      {
        url: '/products/velvet-reserve-1.webp',
        alt: 'Dark plums, folded velvet, and patchouli leaf',
      },
      {
        url: '/products/velvet-reserve-2.webp',
        alt: 'Crushed velvet, ambrette, and vetiver roots',
      },
    ],
    pronunciation: 'VEL-vit ri-ZERV',
    meaning: 'Held back, kept dark',
    taglinePrimary: 'Kept for those who wait.',
    taglineTranslation: 'جو انتظار کرتے ہیں ان کے لیے۔',
    meaningStory: {
      heading: 'The last word in the collection',
      body: [
        'Velvet Reserve closes out the Limited Edition line the way a reserve bottling should — patchouli and dark musk laid over vetiver and ambrette, deep, unhurried, and slow to let go.',
        'The name is literal: this is the one we held back, released only in small numbers, meant for whoever is patient enough to seek it out rather than whoever finds it first.',
      ],
      bodyTranslation: [
        'مخملی ذخیرہ لمیٹڈ لائن کو ویسے بند کرتا ہے جیسے ایک ریزرو بوتل کو ہونا چاہیے — پیچولی اور سیاہ مشک، ویٹیور اور امبریٹ پر، گہری، بے جلدی، چھوڑنے میں سست۔',
        'نام لفظی ہے: یہ وہ ہے جسے ہم نے روک کر رکھا، چھوٹی تعداد میں، اس کے لیے جو پہلے ملنے والے کے بجائے ڈھونڈنے کا انتظار کرے۔',
      ],
    },
    notesPyramid: {
      opening: {
        notes: ['Dark plum', 'Bergamot'],
        notesTranslation: ['آلو بخارا', 'برگاموٹ'],
      },
      heart: {
        notes: ['Patchouli', 'Rose', 'Ambrette'],
        notesTranslation: ['پیچولی', 'گلاب', 'امبریٹ'],
      },
      base: {
        notes: ['Vetiver', 'Dark musk', 'Oakmoss'],
        notesTranslation: ['ویٹیور', 'سیاہ مشک', 'اوک ماس'],
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
        question: 'Is Velvet Reserve a limited release?',
        answer:
          'Yes — it is held back in small numbers as the last word in the Limited Edition line. When a batch is gone, it is gone.',
      },
    ],
  });

  await seedDemoReviews({
    'citrus-atelier': 0,
    'monsoon-letters': 0,
    'velvet-reserve': 0,
    'noir-velvet': 5,
    'attar-of-sundays': 5,
    'smoke-and-saffron': 5,
    'cedar-sessions': 10,
    'amber-meridian': 10,
    'oud-ishraq': 10,
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
