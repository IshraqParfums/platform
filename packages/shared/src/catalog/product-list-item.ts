export interface ProductListPrimaryImage {
  url: string;
  altText: string | null;
}

export interface ProductListItem {
  name: string;
  slug: string;
  shortDescription: string;
  collectionSlug: string;
  primaryImage: ProductListPrimaryImage | null;
  fromSizeMl: number | null;
  fromPricePaise: number | null;
  fromCompareAtPricePaise: number | null;
}
