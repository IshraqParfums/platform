import type {
  AdminProductDetail,
  AdminProductImage,
  AdminProductListItem,
  AdminProductVariant,
  ProductDetail,
  ProductDetailImage,
  ProductDetailVariant,
  ProductListItem,
  ProductListPrimaryImage,
} from '@ishraqparfums/shared';
import type {
  Collection,
  Product,
  ProductImage,
  ProductVariant,
} from '@prisma/client';

export type ProductWithCatalogRelations = Product & {
  collection: Collection;
  variants: ProductVariant[];
  images: ProductImage[];
};

export type PurchasableVariantWithProduct = ProductVariant & {
  product: Product & {
    images: ProductImage[];
  };
};

export function displayCompareAtPricePaise(
  pricePaise: number,
  compareAtPricePaise: number | null,
): number | null {
  if (compareAtPricePaise === null || compareAtPricePaise <= pricePaise) {
    return null;
  }

  return compareAtPricePaise;
}

function toPrimaryImage(
  images: ProductImage[],
): ProductListPrimaryImage | null {
  const image = images[0];

  if (!image) {
    return null;
  }

  return {
    url: image.url,
    altText: image.altText,
  };
}

function findCheapestVariant(
  variants: ProductVariant[],
): ProductVariant | null {
  if (variants.length === 0) {
    return null;
  }

  return variants.reduce((cheapest, variant) =>
    variant.pricePaise < cheapest.pricePaise ? variant : cheapest,
  );
}

function toDetailVariant(variant: ProductVariant): ProductDetailVariant {
  return {
    id: variant.id,
    sizeMl: variant.sizeMl,
    pricePaise: variant.pricePaise,
    compareAtPricePaise: displayCompareAtPricePaise(
      variant.pricePaise,
      variant.compareAtPricePaise,
    ),
    stockQty: Math.max(0, variant.stockQty - variant.reservedQty),
    isAvailable: variant.isAvailable,
  };
}

function toDetailImage(image: ProductImage): ProductDetailImage {
  return {
    url: image.url,
    altText: image.altText,
    displayOrder: image.displayOrder,
  };
}

export function toProductListItem(
  product: ProductWithCatalogRelations,
  ratingAverage: number | null = null,
  reviewCount = 0,
): ProductListItem {
  const cheapest = findCheapestVariant(product.variants);

  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    collectionSlug: product.collection.slug,
    primaryImage: toPrimaryImage(product.images),
    fromSizeMl: cheapest?.sizeMl ?? null,
    fromPricePaise: cheapest?.pricePaise ?? null,
    fromCompareAtPricePaise: cheapest
      ? displayCompareAtPricePaise(
          cheapest.pricePaise,
          cheapest.compareAtPricePaise,
        )
      : null,
    ratingAverage,
    reviewCount,
  };
}

export function toProductDetail(
  product: ProductWithCatalogRelations,
  ratingAverage: number | null = null,
  reviewCount = 0,
): ProductDetail {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    detailedDescription: product.detailedDescription,
    collection: {
      name: product.collection.name,
      slug: product.collection.slug,
    },
    variants: product.variants.map(toDetailVariant),
    images: product.images.map(toDetailImage),
    ratingAverage,
    reviewCount,
  };
}

export function toAdminVariant(variant: ProductVariant): AdminProductVariant {
  return {
    id: variant.id,
    sizeMl: variant.sizeMl,
    pricePaise: variant.pricePaise,
    compareAtPricePaise: variant.compareAtPricePaise,
    stockQty: variant.stockQty,
    reservedQty: variant.reservedQty,
    sku: variant.sku,
    isAvailable: variant.isAvailable,
  };
}

export function toAdminImage(image: ProductImage): AdminProductImage {
  return {
    id: image.id,
    url: image.url,
    altText: image.altText,
    displayOrder: image.displayOrder,
  };
}

export function toAdminProductListItem(
  product: ProductWithCatalogRelations,
): AdminProductListItem {
  const cheapest = findCheapestVariant(product.variants);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    collectionId: product.collectionId,
    collectionName: product.collection.name,
    primaryImageUrl: product.images[0]?.url ?? null,
    variantCount: product.variants.length,
    fromPricePaise: cheapest?.pricePaise ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toAdminProductDetail(
  product: ProductWithCatalogRelations,
): AdminProductDetail {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    detailedDescription: product.detailedDescription,
    status: product.status,
    collectionId: product.collectionId,
    collectionName: product.collection.name,
    variants: product.variants.map(toAdminVariant),
    images: product.images.map(toAdminImage),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
