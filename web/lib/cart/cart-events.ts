import type { CartView } from "@/lib/cart/cart-view";

export const CART_CHANGED_EVENT = "ishraq:cart-changed";

/**
 * Badge always gets `itemCount`. When a mutator already holds the new cart,
 * pass `view` so subscribers can apply it without a second GET.
 */
export type CartChangedDetail = {
  itemCount: number;
  view?: CartView;
};

export function emitCartChanged(detail: CartChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CartChangedDetail>(CART_CHANGED_EVENT, {
      detail,
    }),
  );
}

export function subscribeCartChanged(
  listener: (detail: CartChangedDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const custom = event as CustomEvent<CartChangedDetail>;
    if (custom.detail && typeof custom.detail.itemCount === "number") {
      listener(custom.detail);
    }
  };

  window.addEventListener(CART_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CART_CHANGED_EVENT, handler);
}
