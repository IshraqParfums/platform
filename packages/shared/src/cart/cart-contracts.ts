export type CartLineKind = 'catalog' | 'bespoke';

/**
 * Why a catalog line cannot be purchased.
 * `null` when `isAvailable` is true.
 */
export type CartUnavailableReason =
  | 'OUT_OF_STOCK'
  | 'UNAVAILABLE'
  | 'DISCONTINUED';

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
  unavailableReason: CartUnavailableReason | null;
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
  /** False once the owner has deleted the brew the line points at. */
  isAvailable: boolean;
  unavailableReason: CartUnavailableReason | null;
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

/**
 * Mutation response weight. Same routes; `summary` skips the fat cart reload.
 * Default remains `full` so existing callers keep working.
 */
export const CART_MUTATION_VIEWS = ['full', 'summary'] as const;
export type CartMutationView = (typeof CART_MUTATION_VIEWS)[number];
export const DEFAULT_CART_MUTATION_VIEW: CartMutationView = 'full';

export function isCartMutationView(value: unknown): value is CartMutationView {
  return (
    typeof value === 'string' &&
    (CART_MUTATION_VIEWS as readonly string[]).includes(value)
  );
}

/**
 * Slim ack after add / update / remove when `view=summary`.
 * Clients merge into local cart state; no product images.
 */
export interface CartMutationSummary {
  cartId: string;
  itemId: string;
  /** Absolute line quantity after the mutation; `0` when removed. */
  quantity: number;
  itemCount: number;
  lineTotalPaise: number | null;
  /** Available catalog stock after the write; null for bespoke or removed lines. */
  stockQty: number | null;
  /** Catalog variant id when known (add / catalog update); null for bespoke. */
  variantId: string | null;
  /** Bespoke brew id when the mutated line is bespoke. */
  bespokePerfumeId?: string | null;
  /** Bottle size for a bespoke line (ml). */
  sizeMl?: number | null;
}

export type CartMutationResult = CartResponse | CartMutationSummary;

export function isCartMutationSummary(
  value: CartMutationResult,
): value is CartMutationSummary {
  return !('items' in value);
}

export function isCartResponse(
  value: CartMutationResult,
): value is CartResponse {
  return 'items' in value;
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
