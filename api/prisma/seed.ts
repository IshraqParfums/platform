import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertCollection(input: {
  slug: string;
  name: string;
  description: string;
}) {
  return prisma.collection.upsert({
    where: { slug: input.slug },
    create: input,
    update: {
      name: input.name,
      description: input.description,
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

  const existingImage = await prisma.productImage.findFirst({
    where: { productId: product.id, displayOrder: 0 },
  });

  if (existingImage) {
    await prisma.productImage.update({
      where: { id: existingImage.id },
      data: {
        url: input.imageUrl,
        altText: input.imageAlt,
      },
    });
  } else {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: input.imageUrl,
        altText: input.imageAlt,
        displayOrder: 0,
      },
    });
  }

  return product;
}

async function main() {
  const designer = await upsertCollection({
    slug: 'designer',
    name: 'Designer',
    description: 'Contemporary designer-inspired compositions.',
  });

  const nostalgia = await upsertCollection({
    slug: 'nostalgia',
    name: 'Nostalgia',
    description: 'Memory-led scents with warm, familiar depth.',
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
      {
        sizeMl: 100,
        pricePaise: 449900,
        compareAtPricePaise: 529900,
        stockQty: 12,
      },
    ],
    imageUrl: 'https://placehold.co/800x1000/2C1B14/F3E7D8?text=Noir+Velvet',
    imageAlt: 'Noir Velvet perfume bottle',
  });

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
      { sizeMl: 100, pricePaise: 399900, stockQty: 18 },
    ],
    imageUrl: 'https://placehold.co/800x1000/3D2519/F3E7D8?text=Citrus+Atelier',
    imageAlt: 'Citrus Atelier perfume bottle',
  });

  await upsertProductWithDetails({
    slug: 'monsoon-letters',
    name: 'Monsoon Letters',
    collectionId: nostalgia.id,
    shortDescription: 'Rain-soaked paper, tea, and soft woods.',
    detailedDescription:
      'Monsoon Letters captures wet earth after rain, warm tea steam, and the quiet of old letters — a nostalgic skin scent with gentle projection.',
    variants: [
      { sizeMl: 30, pricePaise: 179900, stockQty: 20 },
      { sizeMl: 100, pricePaise: 429900, stockQty: 10 },
    ],
    imageUrl: 'https://placehold.co/800x1000/4A2F22/F3E7D8?text=Monsoon+Letters',
    imageAlt: 'Monsoon Letters perfume bottle',
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
