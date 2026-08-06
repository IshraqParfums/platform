export const CART_CHANGED_EVENT = "ishraq:cart-changed";

export type CartChangedDetail = {
  itemCount: number;
};

export function emitCartChanged(itemCount: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CartChangedDetail>(CART_CHANGED_EVENT, {
      detail: { itemCount },
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
