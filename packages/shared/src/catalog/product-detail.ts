export interface ProductDetailCollection {
  name: string;
  slug: string;
}

export interface ProductDetailVariant {
  id: string;
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQty: number;
  isAvailable: boolean;
}

export interface ProductDetailImage {
  url: string;
  altText: string | null;
  displayOrder: number;
}

/**
 * Storefront shelf state — shared by PDP, list cards, cart, and (later) wishlist.
 *
 * - AVAILABLE: Active with at least one sellable size (flagged on + free stock).
 * - OUT_OF_STOCK: Active, still on the shop shelf, but no free stock right now.
 * - UNAVAILABLE: Off the shop shelf (archived, draft/deleted, or all sizes flagged off).
 */
export type ProductAvailability =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "UNAVAILABLE";

export interface ProductDetail {
  name: string;
  /** Urdu (Nastaliq) name. Display-only; null until an admin fills it in. */
  nameUrdu: string | null;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  collection: ProductDetailCollection;
  variants: ProductDetailVariant[];
  images: ProductDetailImage[];
  availability: ProductAvailability;
  ratingAverage: number | null;
  reviewCount: number;
}
