import type { ProductListItem } from "@ishraqparfums/shared";
import { safeStorageSet } from "@/lib/storage/safe-storage";

export const GUEST_WISHLIST_STORAGE_KEY = "ishraq_guest_wishlist_v1";

/**
 * Full `ProductListItem` snapshot captured at save time, not a trimmed
 * subset — the guest wishlist page renders the same row component as the
 * signed-in one and needs the same fields that component actually reads.
 */
export type GuestWishlistItem = ProductListItem & { addedAt: string };

export type GuestWishlist = {
  items: GuestWishlistItem[];
  updatedAt: string;
};

function emptyWishlist(): GuestWishlist {
  return { items: [], updatedAt: new Date().toISOString() };
}

function isValidGuestWishlistItem(item: unknown): item is GuestWishlistItem {
  if (typeof item !== "object" || item === null) return false;
  const row = item as Record<string, unknown>;
  return (
    typeof row.slug === "string" &&
    typeof row.name === "string" &&
    typeof row.shortDescription === "string" &&
    typeof row.collectionSlug === "string" &&
    Array.isArray(row.openingNotes) &&
    Array.isArray(row.images) &&
    typeof row.availability === "string" &&
    typeof row.addedAt === "string"
  );
}

export function readGuestWishlist(): GuestWishlist {
  if (typeof window === "undefined") return emptyWishlist();
  try {
    const raw = window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
    if (!raw) return emptyWishlist();
    const parsed = JSON.parse(raw) as GuestWishlist;
    if (!parsed || !Array.isArray(parsed.items)) return emptyWishlist();
    return {
      items: parsed.items.filter(isValidGuestWishlistItem),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptyWishlist();
  }
}

export function writeGuestWishlist(wishlist: GuestWishlist): void {
  safeStorageSet(
    "local",
    GUEST_WISHLIST_STORAGE_KEY,
    JSON.stringify({ ...wishlist, updatedAt: new Date().toISOString() }),
  );
}

/** No-op if the product is already saved. */
export function addGuestWishlistItem(
  product: ProductListItem,
): GuestWishlist {
  const wishlist = readGuestWishlist();
  if (wishlist.items.some((item) => item.slug === product.slug)) {
    return wishlist;
  }
  wishlist.items = [
    { ...product, addedAt: new Date().toISOString() },
    ...wishlist.items,
  ];
  writeGuestWishlist(wishlist);
  return wishlist;
}

export function removeGuestWishlistItem(slug: string): GuestWishlist {
  const wishlist = readGuestWishlist();
  wishlist.items = wishlist.items.filter((item) => item.slug !== slug);
  writeGuestWishlist(wishlist);
  return wishlist;
}

export function clearGuestWishlist(): void {
  writeGuestWishlist(emptyWishlist());
}

export function guestWishlistSlugs(
  wishlist: GuestWishlist = readGuestWishlist(),
): Set<string> {
  return new Set(wishlist.items.map((item) => item.slug));
}

export function guestWishlistItemCount(
  wishlist: GuestWishlist = readGuestWishlist(),
): number {
  return wishlist.items.length;
}
