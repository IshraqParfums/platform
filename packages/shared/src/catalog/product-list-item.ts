import type { ProductAvailability } from "./product-detail.js";

export interface ProductListPrimaryImage {
  url: string;
  altText: string | null;
}

export interface ProductListItem {
  name: string;
  /** Urdu (Nastaliq) name. Display-only; null until an admin fills it in. */
  nameUrdu: string | null;
  slug: string;
  shortDescription: string;
  /**
   * First few opening notes from the pyramid — teaser for list/home cards.
   * Empty when the product has no opening notes yet.
   */
  openingNotes: string[];
  collectionSlug: string;
  primaryImage: ProductListPrimaryImage | null;
  /** Gallery in display order. `primaryImage` is `images[0]` when present. */
  images: ProductListPrimaryImage[];
  fromSizeMl: number | null;
  fromPricePaise: number | null;
  fromCompareAtPricePaise: number | null;
  /** Same contract as ProductDetail.availability — list cards / filters / wishlist. */
  availability: ProductAvailability;
  ratingAverage: number | null;
  reviewCount: number;
}
