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
import { applyCartMutationSummary } from "@/lib/cart/apply-cart-mutation-summary";
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

export type CartLineWriteOptions = {
  emit?: boolean;
  /**
   * Local cart to merge a `view=summary` ack into. Cart-page writes pass this
   * so we skip the full cart graph. Omit for a full reload.
   */
  base?: CartView;
};

function catalogSeedFromLine(line: CartViewLine) {
  if (line.kind !== "catalog" || !line.variantId) return undefined;
  return {
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
  };
}

function bespokeSeedFromLine(line: CartViewLine) {
  if (line.kind !== "bespoke" || !line.bespokePerfumeId) return undefined;
  return {
    bespokePerfumeId: line.bespokePerfumeId,
    sizeMl: line.sizeMl,
    pricePaise: line.pricePaise,
    productName: line.productName,
  };
}

function mergeServerResult(
  result: CartMutationResult,
  options: CartLineWriteOptions | undefined,
  line: CartViewLine,
): CartView {
  if (isCartMutationSummary(result)) {
    if (!options?.base) {
      throw new Error("Summary mutation requires a base cart view");
    }
    return applyCartMutationSummary(
      options.base,
      result,
      catalogSeedFromLine(line),
      bespokeSeedFromLine(line),
    );
  }
  if (!isCartResponse(result)) {
    throw new Error("Unexpected cart mutation response");
  }
  return cartViewFromServer(result);
}

function publishIfNeeded(
  view: CartView,
  options?: CartLineWriteOptions,
): CartView {
  return options?.emit === false ? view : publishCart(view);
}

/** Cart page / callers that want a `CartView` after the write. */
export async function setCartLineQuantity(
  line: CartViewLine,
  quantity: number,
  mode: CartView["mode"],
  options?: CartLineWriteOptions,
): Promise<CartView> {
  if (mode === "guest") {
    if (line.kind === "bespoke" && line.bespokePerfumeId) {
      setGuestBespokeQuantity(line.bespokePerfumeId, line.sizeMl, quantity);
      return publishIfNeeded(
        cartViewFromGuest(readGuestCart().items),
        options,
      );
    }
    if (!line.variantId) return cartViewFromGuest(readGuestCart().items);
    setGuestCartQuantity(line.variantId, quantity);
    return publishIfNeeded(cartViewFromGuest(readGuestCart().items), options);
  }

  if (!line.itemId) {
    throw new Error("Missing cart item id");
  }

  const mutationView = options?.base ? "summary" : "full";
  const result = await mutateCartItemQuantity(
    line.itemId,
    quantity,
    mutationView,
  );
  return publishIfNeeded(mergeServerResult(result, options, line), options);
}

export async function removeCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
  options?: CartLineWriteOptions,
): Promise<CartView> {
  const view = await deleteCartLine(line, mode, options);
  return publishIfNeeded(view, options);
}

async function deleteCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
  options?: CartLineWriteOptions,
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

  const mutationView = options?.base ? "summary" : "full";
  const result = await mutateCartItemRemove(line.itemId, mutationView);
  return mergeServerResult(result, options, line);
}

async function postCartItem(
  path: string,
  body: Record<string, unknown>,
  options: CartLineWriteOptions | undefined,
  line: CartViewLine,
): Promise<CartView> {
  const mutationView = options?.base ? "summary" : "full";
  const separator = path.includes("?") ? "&" : "?";
  const url =
    mutationView === "summary"
      ? `${path}${separator}view=summary`
      : `${path}${separator}view=full`;

  const response = await shopFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }

  const result = (await response.json()) as CartMutationResult;
  return publishIfNeeded(mergeServerResult(result, options, line), options);
}

/**
 * Inverse of `removeCartLine`. Undo must write, not only restore React state,
 * or a reload resurrects the empty cart. Stays in `mode`: a 401 is a failed
 * undo, not a guest-cart split.
 */
export async function restoreCartLine(
  line: CartViewLine,
  mode: CartView["mode"],
  options?: CartLineWriteOptions,
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
          position: line.position,
        },
        line.quantity,
      );
      return publishIfNeeded(
        cartViewFromGuest(readGuestCart().items),
        options,
      );
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
        position: line.position,
      },
      line.quantity,
    );
    return publishIfNeeded(cartViewFromGuest(readGuestCart().items), options);
  }

  if (line.kind === "bespoke") {
    if (!line.bespokePerfumeId) {
      throw new Error("Missing bespoke perfume id");
    }
    return postCartItem(
      "/api/cart/items/bespoke",
      {
        bespokePerfumeId: line.bespokePerfumeId,
        sizeMl: line.sizeMl,
        quantity: line.quantity,
        position: line.position,
      },
      options,
      line,
    );
  }

  if (!line.variantId) {
    throw new Error("Missing variant id");
  }
  return postCartItem(
    "/api/cart/items",
    {
      variantId: line.variantId,
      quantity: line.quantity,
      position: line.position,
    },
    options,
    line,
  );
}

export function readLocalCartCount(): number {
  return guestCartItemCount();
}

export { emptyCartView, isCartMutationSummary, isCartResponse };
