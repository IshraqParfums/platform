import type { CartResponse } from "@ishraqparfums/shared";
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

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return "Something went wrong";
}

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

export async function setCartLineQuantity(
  line: CartViewLine,
  quantity: number,
  mode: CartView["mode"],
): Promise<CartView> {
  if (mode === "guest") {
    if (!line.variantId) return cartViewFromGuest(readGuestCart().items);
    setGuestCartQuantity(line.variantId, quantity);
    const view = cartViewFromGuest(readGuestCart().items);
    emitCartChanged(view.itemCount);
    return view;
  }

  if (!line.itemId) {
    throw new Error("Missing cart item id");
  }

  const response = await shopFetch(
    `/api/cart/items/${encodeURIComponent(line.itemId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const cart = (await response.json()) as CartResponse;
  const view = cartViewFromServer(cart);
  emitCartChanged(view.itemCount);
  return view;
}

export async function removeCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
): Promise<CartView> {
  if (mode === "guest") {
    if (!line.variantId) return cartViewFromGuest(readGuestCart().items);
    removeGuestCartItem(line.variantId);
    const view = cartViewFromGuest(readGuestCart().items);
    emitCartChanged(view.itemCount);
    return view;
  }

  if (!line.itemId) {
    throw new Error("Missing cart item id");
  }

  const response = await shopFetch(
    `/api/cart/items/${encodeURIComponent(line.itemId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const cart = (await response.json()) as CartResponse;
  const view = cartViewFromServer(cart);
  emitCartChanged(view.itemCount);
  return view;
}

export function readLocalCartCount(): number {
  return guestCartItemCount();
}

export { emptyCartView };
