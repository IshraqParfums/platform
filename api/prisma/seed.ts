import { PrismaClient, ProductStatus } from '@prisma/client';

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

async function upsertProductWithDetails(input: {
  slug: string;
  name: string;
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
}) {
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      collectionId: input.collectionId,
      shortDescription: input.shortDescription,
      detailedDescription: input.detailedDescription,
      status: ProductStatus.ACTIVE,
    },
    update: {
      name: input.name,
      collectionId: input.collectionId,
      shortDescription: input.shortDescription,
      detailedDescription: input.detailedDescription,
      status: ProductStatus.ACTIVE,
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
  });

  await upsertProductWithDetails({
    slug: 'noir-velvet',
    name: 'Noir Velvet',
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
  });

  await upsertProductWithDetails({
    slug: 'cedar-sessions',
    name: 'Cedar Sessions',
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
  });

  // --- Nostalgia ----------------------------------------------------------
  await upsertProductWithDetails({
    slug: 'monsoon-letters',
    name: 'Monsoon Letters',
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
  });

  await upsertProductWithDetails({
    slug: 'attar-of-sundays',
    name: 'Attar of Sundays',
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
  });

  await upsertProductWithDetails({
    slug: 'amber-meridian',
    name: 'Amber Meridian',
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
  });

  // --- Limited Edition ------------------------------------------------
  await upsertProductWithDetails({
    slug: 'oud-ishraq',
    name: 'Oud Ishraq',
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
  });

  await upsertProductWithDetails({
    slug: 'smoke-and-saffron',
    name: 'Smoke & Saffron',
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
  });

  // TODO: swap for real generated photography once available — every other
  // product in this seed uses the real bottle renders committed at
  // web/public/products/; this is the one exception.
  await upsertProductWithDetails({
    slug: 'velvet-reserve',
    name: 'Velvet Reserve',
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
