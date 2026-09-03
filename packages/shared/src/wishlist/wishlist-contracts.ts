import type { ProductListItem } from "../catalog/product-list-item.js";

/**
 * A saved product, shaped exactly like a catalog list card plus the two
 * fields that make it a wishlist row rather than a shop card: the row's own
 * id (stable key, and the only id `DELETE /wishlist/items/:slug` doesn't
 * need but the page's list rendering does) and when it was saved.
 */
export interface WishlistItemResponse extends ProductListItem {
  id: string;
  addedAt: string;
}

export interface WishlistResponse {
  id: string;
  items: WishlistItemResponse[];
  itemCount: number;
}

/** The cheap payload behind every heart button — slugs only, no display data. */
export interface WishlistIdsResponse {
  slugs: string[];
}

export interface WishlistMergeResponse {
  wishlist: WishlistResponse;
}
