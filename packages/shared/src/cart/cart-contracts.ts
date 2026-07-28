export interface CartItemResponse {
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
  primaryImageUrl: string | null;
  lineTotalPaise: number;
}

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
