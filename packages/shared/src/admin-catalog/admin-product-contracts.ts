export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED';

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
  slug: string;
  status: ProductStatus;
  collectionId: string;
  collectionName: string;
  primaryImageUrl: string | null;
  variantCount: number;
  fromPricePaise: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  status: ProductStatus;
  collectionId: string;
  collectionName: string;
  variants: AdminProductVariant[];
  images: AdminProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductBody {
  collectionId: string;
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  status?: ProductStatus;
}

export interface UpdateProductBody {
  collectionId?: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  detailedDescription?: string;
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

export interface CreateImageBody {
  url: string;
  altText?: string | null;
  displayOrder?: number;
}

export interface UpdateImageBody {
  altText?: string | null;
  displayOrder?: number;
}
