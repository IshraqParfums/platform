import type {
  CartMutationResult,
  CartMutationSummary,
} from "@ishraqparfums/shared";
import { isCartMutationSummary } from "@ishraqparfums/shared";
import { shopFetch } from "@/lib/auth/shop-fetch";
import {
  addGuestCartItem,
  guestCartItemCount,
  type GuestCartSnapshot,
} from "@/lib/cart/guest-cart";
import { emitCartChanged } from "@/lib/cart/cart-events";

export type CartLineSnapshot = GuestCartSnapshot & { variantId: string };

export type AddToCartResult =
  | { mode: "server"; summary: CartMutationSummary }
  | { mode: "guest" };

/**
 * Prefer authenticated BFF cart (refresh on 401). After a failed refresh,
 * fall back to guest localStorage with a display snapshot.
 *
 * Uses `view=summary`. Server callers should merge via `applyCartMutationSummary`
 * (and emit); this helper only emits for the guest fallback.
 */
export async function addToCart(
  snapshot: CartLineSnapshot,
  quantity = 1,
): Promise<AddToCartResult> {
  const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

  const response = await shopFetch("/api/cart/items?view=summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId: snapshot.variantId, quantity: qty }),
  });

  if (response.status === 401) {
    addGuestCartItem(snapshot, qty);
    emitCartChanged({ itemCount: guestCartItemCount() });
    return { mode: "guest" };
  }

  if (!response.ok) {
    let message = "Could not add to cart";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as CartMutationResult;
  if (!isCartMutationSummary(payload)) {
    throw new Error("Expected cart mutation summary");
  }

  return { mode: "server", summary: payload };
}
