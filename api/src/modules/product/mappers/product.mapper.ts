import type {
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

function displayCompareAtPricePaise(
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
    stockQty: variant.stockQty,
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
  };
}

export function toProductDetail(
  product: ProductWithCatalogRelations,
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
  };
}
