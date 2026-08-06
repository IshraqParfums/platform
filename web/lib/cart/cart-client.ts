import type {
  CartMutationResult,
  CartMutationView,
  CartResponse,
} from "@ishraqparfums/shared";
import {
  DEFAULT_CART_MUTATION_VIEW,
  isCartMutationSummary,
  isCartResponse,
} from "@ishraqparfums/shared";
import { apiErrorFrom } from "@/lib/api/api-error";
import { shopFetch } from "@/lib/auth/shop-fetch";
import { emitCartChanged } from "@/lib/cart/cart-events";
import {
  guestCartItemCount,
  readGuestCart,
  removeGuestCartItem,
  setGuestCartQuantity,
} from "@/lib/cart/guest-cart";
import {
  cartViewFromGuest,
  cartViewFromServer,
  emptyCartView,
  type CartView,
  type CartViewLine,
} from "@/lib/cart/cart-view";

/**
 * Prefer server cart via shopFetch (refresh on 401). Fall back to guest
 * localStorage when unauthenticated or after a failed refresh.
 */
export async function loadCart(): Promise<CartView> {
  const response = await shopFetch("/api/cart", { cache: "no-store" });
  if (response.ok) {
    const cart = (await response.json()) as CartResponse;
    return cartViewFromServer(cart);
  }

  return cartViewFromGuest(readGuestCart().items);
}

function publishCart(view: CartView): CartView {
  emitCartChanged({ itemCount: view.itemCount, view });
  return view;
}

function mutationQuery(view: CartMutationView): string {
  return view === "summary" ? "?view=summary" : "";
}

/**
 * Server cart quantity write. `view=summary` returns a slim ack; `full` the cart.
 */
export async function mutateCartItemQuantity(
  itemId: string,
  quantity: number,
  view: CartMutationView = DEFAULT_CART_MUTATION_VIEW,
): Promise<CartMutationResult> {
  const response = await shopFetch(
    `/api/cart/items/${encodeURIComponent(itemId)}${mutationQuery(view)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
  );

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }

  return (await response.json()) as CartMutationResult;
}

export async function mutateCartItemRemove(
  itemId: string,
  view: CartMutationView = DEFAULT_CART_MUTATION_VIEW,
): Promise<CartMutationResult> {
  const response = await shopFetch(
    `/api/cart/items/${encodeURIComponent(itemId)}${mutationQuery(view)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }

  return (await response.json()) as CartMutationResult;
}

/** Cart page / callers that want a full `CartView` after the write. */
export async function setCartLineQuantity(
  line: CartViewLine,
  quantity: number,
  mode: CartView["mode"],
): Promise<CartView> {
  if (mode === "guest") {
    if (!line.variantId) return cartViewFromGuest(readGuestCart().items);
    setGuestCartQuantity(line.variantId, quantity);
    return publishCart(cartViewFromGuest(readGuestCart().items));
  }

  if (!line.itemId) {
    throw new Error("Missing cart item id");
  }

  const result = await mutateCartItemQuantity(line.itemId, quantity, "full");
  if (!isCartResponse(result)) {
    throw new Error("Expected full cart response");
  }
  return publishCart(cartViewFromServer(result));
}

export async function removeCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
): Promise<CartView> {
  if (mode === "guest") {
    if (!line.variantId) return cartViewFromGuest(readGuestCart().items);
    removeGuestCartItem(line.variantId);
    return publishCart(cartViewFromGuest(readGuestCart().items));
  }

  if (!line.itemId) {
    throw new Error("Missing cart item id");
  }

  const result = await mutateCartItemRemove(line.itemId, "full");
  if (!isCartResponse(result)) {
    throw new Error("Expected full cart response");
  }
  return publishCart(cartViewFromServer(result));
}

export function readLocalCartCount(): number {
  return guestCartItemCount();
}

export { emptyCartView, isCartMutationSummary, isCartResponse };
