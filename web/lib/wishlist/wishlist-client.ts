import type {
  ProductListItem,
  WishlistIdsResponse,
  WishlistResponse,
} from "@ishraqparfums/shared";
import { shopFetch } from "@/lib/auth/shop-fetch";
import {
  addGuestWishlistItem,
  guestWishlistSlugs,
  readGuestWishlist,
  removeGuestWishlistItem,
  type GuestWishlistItem,
} from "@/lib/wishlist/guest-wishlist";
import { emitWishlistChanged } from "@/lib/wishlist/wishlist-events";

/**
 * Guest items already carry every field `ProductListItem` does (see
 * `guest-wishlist.ts`), so a server row and a guest row need no adapter —
 * the view is the same shape either way, just with or without a real
 * wishlist-row `id` behind it. Nothing on the frontend needs that id: removal
 * is keyed by `slug` (the toggle button only ever knows the slug it renders
 * for), and `slug` is already a stable, unique React key.
 */
export type WishlistView = {
  mode: "server" | "guest";
  items: (ProductListItem | GuestWishlistItem)[];
  itemCount: number;
};

function viewFromServer(data: WishlistResponse): WishlistView {
  return { mode: "server", items: data.items, itemCount: data.itemCount };
}

function viewFromGuest(): WishlistView {
  const guest = readGuestWishlist();
  return { mode: "guest", items: guest.items, itemCount: guest.items.length };
}

// --- Single-flight, cached slug set — the cheap path every heart button reads ---

let slugsCache: Set<string> | null = null;
let slugsInFlight: Promise<Set<string>> | null = null;

function setSlugsCache(slugs: Set<string>): void {
  slugsCache = slugs;
  emitWishlistChanged({ slugs });
}

/**
 * Public escape hatch for mutations this module doesn't own — currently just
 * `mergeGuestWishlistAfterLogin()` in `login-form.tsx`. Without this, that
 * merge could only broadcast the event, leaving this module's own cache
 * stale for the next `getWishlistedSlugs()` caller.
 */
export function setWishlistedSlugsCache(slugs: Set<string>): void {
  setSlugsCache(slugs);
}

/**
 * Cached across calls, not just de-duped concurrently — the first heart
 * button on a page (shop grid, PDP) triggers one fetch; every other heart
 * button on the same page reads the cache. `loadWishlist()` primes this
 * cache from its own response, so visiting `/wishlist` never fires a second,
 * redundant `/wishlist/ids` call on top of its own `GET /wishlist`.
 */
export function getWishlistedSlugs(): Promise<Set<string>> {
  if (slugsCache) return Promise.resolve(slugsCache);
  if (slugsInFlight) return slugsInFlight;

  slugsInFlight = (async () => {
    try {
      const response = await shopFetch("/api/wishlist/ids", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as WishlistIdsResponse;
        const slugs = new Set(data.slugs);
        slugsCache = slugs;
        return slugs;
      }
    } catch {
      /* fall through to guest */
    }
    const slugs = guestWishlistSlugs();
    slugsCache = slugs;
    return slugs;
  })();

  void slugsInFlight.finally(() => {
    slugsInFlight = null;
  });

  return slugsInFlight;
}

/** Full view for the `/wishlist` page — server-fetch, guest-fallback, same as `loadCart()`. */
export async function loadWishlist(): Promise<WishlistView> {
  try {
    const response = await shopFetch("/api/wishlist", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as WishlistResponse;
      setSlugsCache(new Set(data.items.map((item) => item.slug)));
      return viewFromServer(data);
    }
  } catch {
    /* fall through to guest */
  }

  const view = viewFromGuest();
  setSlugsCache(new Set(view.items.map((item) => item.slug)));
  return view;
}

async function errorMessageFrom(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Prefer the authenticated BFF (refresh on 401); fall back to guest
 * localStorage after a failed refresh — same shape as `addToCart()`.
 */
export async function addWishlistItem(product: ProductListItem): Promise<void> {
  const response = await shopFetch("/api/wishlist/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: product.slug }),
  });

  if (response.status === 401) {
    addGuestWishlistItem(product);
    setSlugsCache(guestWishlistSlugs());
    return;
  }

  if (!response.ok) {
    throw new Error(await errorMessageFrom(response, "Could not save to wishlist"));
  }

  const data = (await response.json()) as WishlistResponse;
  setSlugsCache(new Set(data.items.map((item) => item.slug)));
}

export async function removeWishlistItem(slug: string): Promise<void> {
  const response = await shopFetch(
    `/api/wishlist/items/${encodeURIComponent(slug)}`,
    { method: "DELETE" },
  );

  if (response.status === 401) {
    removeGuestWishlistItem(slug);
    setSlugsCache(guestWishlistSlugs());
    return;
  }

  if (!response.ok) {
    throw new Error(await errorMessageFrom(response, "Could not remove from wishlist"));
  }

  const data = (await response.json()) as WishlistResponse;
  setSlugsCache(new Set(data.items.map((item) => item.slug)));
}
