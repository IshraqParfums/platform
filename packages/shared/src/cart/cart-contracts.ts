export type CartLineKind = 'catalog' | 'bespoke';

export interface CatalogCartItemResponse {
  kind: 'catalog';
  id: string;
  variantId: string;
  quantity: number;
  sizeMl: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  stockQty: number;
  isAvailable: boolean;
  productName: string;
  productSlug: string;
  collectionName: string | null;
  shortDescription: string | null;
  primaryImageUrl: string | null;
  lineTotalPaise: number;
}

export interface BespokeCartItemResponse {
  kind: 'bespoke';
  id: string;
  bespokePerfumeId: string;
  quantity: number;
  sizeMl: number;
  pricePaise: number;
  productName: string;
  productSlug: 'bespoke';
  primaryImageUrl: null;
  lineTotalPaise: number;
}

export type CartItemResponse =
  | CatalogCartItemResponse
  | BespokeCartItemResponse;

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  subtotalPaise: number;
  itemCount: number;
}

export interface CartMergeResponse {
  cart: CartResponse;
  warnings: string[];
}

export interface AddCartItemBody {
  variantId: string;
  quantity: number;
}

export interface AddBespokeCartItemBody {
  bespokePerfumeId: string;
  sizeMl: number;
  quantity: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

export interface MergeCartItemBody {
  variantId: string;
  quantity: number;
}

export interface MergeCartBody {
  items: MergeCartItemBody[];
}
