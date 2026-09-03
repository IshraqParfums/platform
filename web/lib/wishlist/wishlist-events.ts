export const WISHLIST_CHANGED_EVENT = "ishraq:wishlist-changed";

export type WishlistChangedDetail = {
  slugs: Set<string>;
};

export function emitWishlistChanged(detail: WishlistChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<WishlistChangedDetail>(WISHLIST_CHANGED_EVENT, {
      detail,
    }),
  );
}

export function subscribeWishlistChanged(
  listener: (detail: WishlistChangedDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const custom = event as CustomEvent<WishlistChangedDetail>;
    if (custom.detail?.slugs instanceof Set) {
      listener(custom.detail);
    }
  };

  window.addEventListener(WISHLIST_CHANGED_EVENT, handler);
  return () => window.removeEventListener(WISHLIST_CHANGED_EVENT, handler);
}
