import type { ProductDetail, ProductListItem } from "@ishraqparfums/shared";

const OPENING_NOTES_PREVIEW = 3;

/**
 * Adapts the PDP's full `ProductDetail` down to the same `ProductListItem`
 * shape the shop grid already works with — needed wherever the PDP wants to
 * reuse a list-card-shaped piece (the wishlist heart's guest snapshot, so a
 * guest hearting a product from its own page gets the same full display
 * data a guest hearting it from the shop grid would).
 */
export function productDetailToListItem(
  product: ProductDetail,
): ProductListItem {
  const images = [...product.images].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const primaryImage = images[0]
    ? { url: images[0].url, altText: images[0].altText }
    : null;

  const cheapest = product.variants.reduce<
    (typeof product.variants)[number] | null
  >((min, variant) => (!min || variant.pricePaise < min.pricePaise ? variant : min), null);

  return {
    name: product.name,
    nameUrdu: product.nameUrdu,
    slug: product.slug,
    shortDescription: product.shortDescription,
    openingNotes: (product.notesPyramid?.opening?.notes ?? []).slice(
      0,
      OPENING_NOTES_PREVIEW,
    ),
    collectionSlug: product.collection.slug,
    primaryImage,
    images: images.map((image) => ({
      url: image.url,
      altText: image.altText,
    })),
    fromSizeMl: cheapest?.sizeMl ?? null,
    fromPricePaise: cheapest?.pricePaise ?? null,
    fromCompareAtPricePaise: cheapest?.compareAtPricePaise ?? null,
    availability: product.availability,
    ratingAverage: product.ratingAverage,
    reviewCount: product.reviewCount,
  };
}
