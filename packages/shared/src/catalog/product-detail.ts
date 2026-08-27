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

/**
 * PDP content — all progressively authored per product, every field
 * independently nullable/empty until an admin fills it in (same convention
 * as `nameUrdu`). Defined once here and imported by `admin-catalog` rather
 * than duplicated, since these are nested shapes rather than the trivial
 * string unions that module otherwise mirrors inline.
 */
export interface ProductIdentity {
  pronunciation: string | null;
  meaning: string | null;
}

export interface ProductTagline {
  /** The leading line — whichever language leads is a content choice, not
   *  fixed by this type. */
  primary: string;
  translation: string | null;
}

export interface ProductMeaningStory {
  heading: string;
  body: string[];
  bodyTranslation: string[] | null;
}

export interface ProductNoteList {
  notes: string[];
  notesTranslation: string[] | null;
}

export interface ProductNotesPyramid {
  opening: ProductNoteList | null;
  heart: ProductNoteList | null;
  base: ProductNoteList | null;
}

export type ProductScentIntensity = "LIGHT" | "MODERATE" | "STRONG";
export type ProductScentSillage = "INTIMATE" | "MODERATE" | "STRONG";
export type ProductScentLongevity =
  | "SHORT"
  | "MODERATE"
  | "LONG"
  | "VERY_LONG";
export type ProductGender = "UNISEX" | "FEMININE" | "MASCULINE";

export interface ProductOlfactoryProfile {
  family: string | null;
  /** Mood/character tags — "Inky", "Powdery", "Dry". */
  character: string[];
  intensity: ProductScentIntensity | null;
  sillage: ProductScentSillage | null;
  longevity: ProductScentLongevity | null;
  season: string[];
  occasion: string[];
  gender: ProductGender | null;
}

export interface ProductFormatInfo {
  formatLabel: string | null;
  concentration: string | null;
  application: string | null;
  bottleDescription: string | null;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

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

  identity: ProductIdentity | null;
  tagline: ProductTagline | null;
  meaningStory: ProductMeaningStory | null;
  notesPyramid: ProductNotesPyramid | null;
  olfactoryProfile: ProductOlfactoryProfile | null;
  format: ProductFormatInfo | null;
  howToUse: string[];
  care: string[];
  claims: string[];
  faq: ProductFaqItem[] | null;
}
