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

export interface ProductDetail {
  name: string;
  slug: string;
  shortDescription: string;
  detailedDescription: string;
  collection: ProductDetailCollection;
  variants: ProductDetailVariant[];
  images: ProductDetailImage[];
  ratingAverage: number | null;
  reviewCount: number;
}
