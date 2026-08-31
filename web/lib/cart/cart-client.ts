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
  addGuestBespokeItem,
  addGuestCartItem,
  guestCartItemCount,
  readGuestCart,
  removeGuestBespokeItem,
  removeGuestCartItem,
  setGuestBespokeQuantity,
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
    if (line.kind === "bespoke" && line.bespokePerfumeId) {
      setGuestBespokeQuantity(line.bespokePerfumeId, line.sizeMl, quantity);
      return publishCart(cartViewFromGuest(readGuestCart().items));
    }
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
  options?: { emit?: boolean },
): Promise<CartView> {
  const emit = options?.emit !== false;
  const view = await deleteCartLine(line, mode);
  return emit ? publishCart(view) : view;
}

async function deleteCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
): Promise<CartView> {
  if (mode === "guest") {
    if (line.kind === "bespoke" && line.bespokePerfumeId) {
      removeGuestBespokeItem(line.bespokePerfumeId, line.sizeMl);
      return cartViewFromGuest(readGuestCart().items);
    }
    if (!line.variantId) return cartViewFromGuest(readGuestCart().items);
    removeGuestCartItem(line.variantId);
    return cartViewFromGuest(readGuestCart().items);
  }

  if (!line.itemId) {
    throw new Error("Missing cart item id");
  }

  const result = await mutateCartItemRemove(line.itemId, "full");
  if (!isCartResponse(result)) {
    throw new Error("Expected full cart response");
  }
  return cartViewFromServer(result);
}

async function postFullCart(
  path: string,
  body: Record<string, unknown>,
): Promise<CartView> {
  const response = await shopFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }

  const result = (await response.json()) as CartMutationResult;
  if (!isCartResponse(result)) {
    throw new Error("Expected full cart response");
  }
  return publishCart(cartViewFromServer(result));
}

/**
 * Inverse of `removeCartLine`. Undo must write, not only restore React state,
 * or a reload resurrects the empty cart. Stays in `mode`: a 401 is a failed
 * undo, not a guest-cart split.
 */
export async function restoreCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
): Promise<CartView> {
  if (mode === "guest") {
    if (line.kind === "bespoke") {
      if (!line.bespokePerfumeId) {
        throw new Error("Missing bespoke perfume id");
      }
      addGuestBespokeItem(
        {
          bespokePerfumeId: line.bespokePerfumeId,
          sizeMl: line.sizeMl,
          pricePaise: line.pricePaise,
          productName: line.productName,
        },
        line.quantity,
      );
      return publishCart(cartViewFromGuest(readGuestCart().items));
    }

    if (!line.variantId) {
      throw new Error("Missing variant id");
    }
    addGuestCartItem(
      {
        variantId: line.variantId,
        productName: line.productName,
        productSlug: line.productSlug,
        collectionName: line.collectionName,
        shortDescription: line.shortDescription,
        sizeMl: line.sizeMl,
        pricePaise: line.pricePaise,
        compareAtPricePaise: line.compareAtPricePaise,
        primaryImageUrl: line.primaryImageUrl,
        stockQty: line.stockQty ?? 0,
      },
      line.quantity,
    );
    return publishCart(cartViewFromGuest(readGuestCart().items));
  }

  if (line.kind === "bespoke") {
    if (!line.bespokePerfumeId) {
      throw new Error("Missing bespoke perfume id");
    }
    return postFullCart("/api/cart/items/bespoke?view=full", {
      bespokePerfumeId: line.bespokePerfumeId,
      sizeMl: line.sizeMl,
      quantity: line.quantity,
    });
  }

  if (!line.variantId) {
    throw new Error("Missing variant id");
  }
  return postFullCart("/api/cart/items?view=full", {
    variantId: line.variantId,
    quantity: line.quantity,
  });
}

export function readLocalCartCount(): number {
  return guestCartItemCount();
}

export { emptyCartView, isCartMutationSummary, isCartResponse };
