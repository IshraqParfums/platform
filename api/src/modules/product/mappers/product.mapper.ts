import type {
  AdminProductDetail,
  AdminProductImage,
  AdminProductListItem,
  AdminProductVariant,
  ProductAvailability,
  ProductDetail,
  ProductDetailImage,
  ProductDetailVariant,
  ProductFaqItem,
  ProductListItem,
  ProductListPrimaryImage,
} from '@ishraqparfums/shared';
import type {
  Collection,
  Product,
  ProductImage,
  ProductVariant,
} from '@prisma/client';
import { ProductStatus } from '@prisma/client';
import {
  availableQty,
  findCheapestDisplayVariant,
  findCheapestSellableVariant,
  isVariantOnShelf,
  isVariantSellable,
} from '../variant-availability';

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

function toDetailVariant(variant: ProductVariant): ProductDetailVariant {
  return {
    id: variant.id,
    sizeMl: variant.sizeMl,
    pricePaise: variant.pricePaise,
    compareAtPricePaise: displayCompareAtPricePaise(
      variant.pricePaise,
      variant.compareAtPricePaise,
    ),
    stockQty: availableQty(variant),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item): item is string => typeof item === 'string')) {
    return null;
  }
  return value;
}

/**
 * Grouped storefront shapes, built from the flat DB columns. `Json?` columns
 * (`meaningStoryJson`, `notesPyramidJson`, `faqJson`) are raw `Prisma.JsonValue`
 * at this layer — not type-checked by the DB — so these defensively re-parse
 * them rather than trusting the stored shape blindly, mirroring the whitelist
 * parsers `product.service.ts` runs before writing. A group collapses to
 * `null` only when every field inside it is null/empty; otherwise it's built
 * with whatever content is present.
 */
function toIdentity(
  product: ProductWithCatalogRelations,
): ProductDetail['identity'] {
  if (!product.pronunciation && !product.meaning) return null;
  return { pronunciation: product.pronunciation, meaning: product.meaning };
}

function toTagline(
  product: ProductWithCatalogRelations,
): ProductDetail['tagline'] {
  if (!product.taglinePrimary) return null;
  return {
    primary: product.taglinePrimary,
    translation: product.taglineTranslation,
  };
}

function toMeaningStory(value: unknown): ProductDetail['meaningStory'] {
  if (!isRecord(value)) return null;
  if (typeof value.heading !== 'string') return null;
  const body = asStringArray(value.body);
  if (!body) return null;
  return {
    heading: value.heading,
    body,
    bodyTranslation: asStringArray(value.bodyTranslation),
  };
}

function toNoteList(
  value: unknown,
): NonNullable<ProductDetail['notesPyramid']>['opening'] {
  if (!isRecord(value)) return null;
  const notes = asStringArray(value.notes);
  if (!notes) return null;
  return { notes, notesTranslation: asStringArray(value.notesTranslation) };
}

function toNotesPyramid(value: unknown): ProductDetail['notesPyramid'] {
  if (!isRecord(value)) return null;
  const opening = toNoteList(value.opening);
  const heart = toNoteList(value.heart);
  const base = toNoteList(value.base);
  if (!opening && !heart && !base) return null;
  return { opening, heart, base };
}

const OPENING_NOTES_PREVIEW = 3;

function toOpeningNotesPreview(value: unknown): string[] {
  const notes = toNotesPyramid(value)?.opening?.notes ?? [];
  return notes.slice(0, OPENING_NOTES_PREVIEW);
}

function toOlfactoryProfile(
  product: ProductWithCatalogRelations,
): ProductDetail['olfactoryProfile'] {
  const hasAny =
    product.scentFamily !== null ||
    product.characterTags.length > 0 ||
    product.intensity !== null ||
    product.sillage !== null ||
    product.longevity !== null ||
    product.season.length > 0 ||
    product.occasion.length > 0 ||
    product.gender !== null;

  if (!hasAny) return null;

  return {
    family: product.scentFamily,
    character: product.characterTags,
    intensity: product.intensity,
    sillage: product.sillage,
    longevity: product.longevity,
    season: product.season,
    occasion: product.occasion,
    gender: product.gender,
  };
}

function toFormatInfo(
  product: ProductWithCatalogRelations,
): ProductDetail['format'] {
  if (
    !product.formatLabel &&
    !product.concentration &&
    !product.application &&
    !product.bottleDescription
  ) {
    return null;
  }

  return {
    formatLabel: product.formatLabel,
    concentration: product.concentration,
    application: product.application,
    bottleDescription: product.bottleDescription,
  };
}

function toFaq(value: unknown): ProductDetail['faq'] {
  if (!Array.isArray(value)) return null;
  const items: ProductFaqItem[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    if (typeof raw.question !== 'string' || typeof raw.answer !== 'string') {
      continue;
    }
    items.push({ question: raw.question, answer: raw.answer });
  }
  return items.length > 0 ? items : null;
}

/**
 * Single shelf contract for PDP + list + cart + future wishlist.
 * Sold-out stays OUT_OF_STOCK (still listable). Shelf-off / archived → UNAVAILABLE.
 */
export function productAvailability(
  product: Pick<Product, 'status'> & { variants: ProductVariant[] },
): ProductAvailability {
  if (product.status !== ProductStatus.ACTIVE) {
    return 'UNAVAILABLE';
  }

  if (!product.variants.some(isVariantOnShelf)) {
    return 'UNAVAILABLE';
  }

  return product.variants.some(isVariantSellable)
    ? 'AVAILABLE'
    : 'OUT_OF_STOCK';
}

export function toProductListItem(
  product: ProductWithCatalogRelations,
  ratingAverage: number | null = null,
  reviewCount = 0,
): ProductListItem {
  const cheapest = findCheapestDisplayVariant(product.variants);

  return {
    name: product.name,
    nameUrdu: product.nameUrdu,
    slug: product.slug,
    shortDescription: product.shortDescription,
    openingNotes: toOpeningNotesPreview(product.notesPyramidJson),
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
    availability: productAvailability(product),
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
    nameUrdu: product.nameUrdu,
    slug: product.slug,
    shortDescription: product.shortDescription,
    collection: {
      name: product.collection.name,
      slug: product.collection.slug,
    },
    variants: product.variants.map(toDetailVariant),
    images: product.images.map(toDetailImage),
    availability: productAvailability(product),
    ratingAverage,
    reviewCount,
    identity: toIdentity(product),
    tagline: toTagline(product),
    meaningStory: toMeaningStory(product.meaningStoryJson),
    notesPyramid: toNotesPyramid(product.notesPyramidJson),
    olfactoryProfile: toOlfactoryProfile(product),
    format: toFormatInfo(product),
    faq: toFaq(product.faqJson),
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
  const cheapest = findCheapestSellableVariant(product.variants);

  return {
    id: product.id,
    name: product.name,
    nameUrdu: product.nameUrdu,
    slug: product.slug,
    status: product.status,
    archiveReason: product.archiveReason,
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
    nameUrdu: product.nameUrdu,
    slug: product.slug,
    shortDescription: product.shortDescription,
    status: product.status,
    archiveReason: product.archiveReason,
    collectionId: product.collectionId,
    collectionName: product.collection.name,
    variants: product.variants.map(toAdminVariant),
    images: product.images.map(toAdminImage),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    pronunciation: product.pronunciation,
    meaning: product.meaning,
    taglinePrimary: product.taglinePrimary,
    taglineTranslation: product.taglineTranslation,
    meaningStory: toMeaningStory(product.meaningStoryJson),
    notesPyramid: toNotesPyramid(product.notesPyramidJson),
    scentFamily: product.scentFamily,
    characterTags: product.characterTags,
    intensity: product.intensity,
    sillage: product.sillage,
    longevity: product.longevity,
    season: product.season,
    occasion: product.occasion,
    gender: product.gender,
    formatLabel: product.formatLabel,
    concentration: product.concentration,
    application: product.application,
    bottleDescription: product.bottleDescription,
    faq: toFaq(product.faqJson),
  };
}
