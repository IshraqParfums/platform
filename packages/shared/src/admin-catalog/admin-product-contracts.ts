import type {
  ProductFaqItem,
  ProductFormatInfo,
  ProductGender,
  ProductIdentity,
  ProductMeaningStory,
  ProductNotesPyramid,
  ProductOlfactoryProfile,
  ProductScentIntensity,
  ProductScentLongevity,
  ProductScentSillage,
  ProductTagline,
} from "../catalog/product-detail.js";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";

export type ProductArchiveReason = "MANUAL" | "COLLECTION";

export interface AdminProductVariant {
  id: string;
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQty: number;
  reservedQty: number;
  sku: string | null;
  isAvailable: boolean;
}

export interface AdminProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  /** Urdu (Nastaliq) name. Display-only; null until an admin fills it in. */
  nameUrdu: string | null;
  slug: string;
  status: ProductStatus;
  archiveReason: ProductArchiveReason | null;
  collectionId: string;
  collectionName: string;
  primaryImageUrl: string | null;
  variantCount: number;
  fromPricePaise: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * PDP content fields, admin side. Deliberately flat here (one field per DB
 * column) rather than grouped like the storefront's `ProductDetail`
 * (`identity`, `tagline`, ...) — the edit form wires one `useState` per
 * scalar field the same way `nameUrdu` already does, and flat access keeps
 * that mechanical. The storefront mapper is what groups these into the
 * nested shape presentational components actually consume.
 */
export interface AdminProductPdpFields {
  pronunciation: string | null;
  meaning: string | null;
  taglinePrimary: string | null;
  meaningStory: ProductMeaningStory | null;
  notesPyramid: ProductNotesPyramid | null;
  scentFamily: string | null;
  characterTags: string[];
  intensity: ProductScentIntensity | null;
  sillage: ProductScentSillage | null;
  longevity: ProductScentLongevity | null;
  season: string[];
  occasion: string[];
  gender: ProductGender | null;
  formatLabel: string | null;
  concentration: string | null;
  application: string | null;
  bottleDescription: string | null;
  faq: ProductFaqItem[] | null;
}

export interface AdminProductDetail extends AdminProductPdpFields {
  id: string;
  name: string;
  /** Urdu (Nastaliq) name. Display-only; null until an admin fills it in. */
  nameUrdu: string | null;
  slug: string;
  shortDescription: string;
  status: ProductStatus;
  archiveReason: ProductArchiveReason | null;
  collectionId: string;
  collectionName: string;
  variants: AdminProductVariant[];
  images: AdminProductImage[];
  createdAt: string;
  updatedAt: string;
}

/** Every PDP content field, optional on write — same "omit or clear" rule as `nameUrdu`. */
export interface WriteProductPdpFields {
  pronunciation?: string;
  meaning?: string;
  taglinePrimary?: string;
  meaningStory?: ProductMeaningStory;
  notesPyramid?: ProductNotesPyramid;
  scentFamily?: string;
  characterTags?: string[];
  intensity?: ProductScentIntensity;
  sillage?: ProductScentSillage;
  longevity?: ProductScentLongevity;
  season?: string[];
  occasion?: string[];
  gender?: ProductGender;
  formatLabel?: string;
  concentration?: string;
  application?: string;
  bottleDescription?: string;
  faq?: ProductFaqItem[];
}

export interface CreateProductBody extends WriteProductPdpFields {
  collectionId: string;
  name: string;
  /** Optional Urdu name. Omit or send "" to leave it empty. */
  nameUrdu?: string;
  slug: string;
  shortDescription: string;
  status?: ProductStatus;
}

export interface UpdateProductBody extends WriteProductPdpFields {
  collectionId?: string;
  name?: string;
  /** Send "" to clear the Urdu name back to null. */
  nameUrdu?: string;
  slug?: string;
  shortDescription?: string;
  status?: ProductStatus;
}

export interface CreateVariantBody {
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise?: number | null;
  sku?: string | null;
  stockQty?: number;
}

export interface UpdateVariantBody {
  pricePaise?: number;
  compareAtPricePaise?: number | null;
  sku?: string | null;
  isAvailable?: boolean;
}

/** Exactly one of `adjustment` (delta) or `stockQty` (absolute set) must be provided. */
export interface AdjustStockBody {
  adjustment?: number;
  stockQty?: number;
}

/**
 * Image creation is `multipart/form-data` (a `file` field + these as text fields),
 * not a JSON body — there is no `CreateImageBody` type. See api/README.md.
 */
export interface UpdateImageBody {
  altText?: string | null;
  displayOrder?: number;
}

/** Low-stock admin row — free stock is `stockQty - reservedQty`. */
export interface AdminLowStockVariant {
  productId: string;
  productName: string;
  variantId: string;
  sizeMl: number;
  stockQty: number;
  reservedQty: number;
}
