import { shopFetch } from "@/lib/auth/shop-fetch";
import {
  addGuestCartItem,
  guestCartItemCount,
  type GuestCartSnapshot,
} from "@/lib/cart/guest-cart";
import { emitCartChanged } from "@/lib/cart/cart-events";

export type CartLineSnapshot = GuestCartSnapshot & { variantId: string };

export type AddToCartResult =
  | { mode: "server" }
  | { mode: "guest" };

/**
 * Prefer authenticated BFF cart (refresh on 401). After a failed refresh,
 * fall back to guest localStorage with a display snapshot.
 */
export async function addToCart(
  snapshot: CartLineSnapshot,
  quantity = 1,
): Promise<AddToCartResult> {
  const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

  const response = await shopFetch("/api/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId: snapshot.variantId, quantity: qty }),
  });

  if (response.status === 401) {
    addGuestCartItem(snapshot, qty);
    emitCartChanged(guestCartItemCount());
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

  try {
    const cart = (await response.json()) as { itemCount?: number };
    emitCartChanged(
      typeof cart.itemCount === "number" ? cart.itemCount : guestCartItemCount(),
    );
  } catch {
    emitCartChanged(guestCartItemCount());
  }

  return { mode: "server" };
}
