"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductListItem } from "@ishraqparfums/shared";
import { toast } from "@/components/ui/toaster";
import {
  addWishlistItem,
  getWishlistedSlugs,
  removeWishlistItem,
} from "@/lib/wishlist/wishlist-client";
import { subscribeWishlistChanged } from "@/lib/wishlist/wishlist-events";

/**
 * The one hook behind every heart button, regardless of which card renders
 * it. Reads the shared cached slug set (cheap after the first heart button
 * on a page primes it) and stays live via the wishlist-changed event, so
 * hearting a product on one card updates every other heart for the same
 * product on the page without a reload.
 */
export function useWishlistItem(product: ProductListItem) {
  const [inWishlist, setInWishlist] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWishlistedSlugs().then((slugs) => {
      if (!cancelled) setInWishlist(slugs.has(product.slug));
    });
    const unsubscribe = subscribeWishlistChanged(({ slugs }) => {
      if (!cancelled) setInWishlist(slugs.has(product.slug));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [product.slug]);

  const toggle = useCallback(async () => {
    setPending(true);
    const wasInWishlist = inWishlist;
    setInWishlist(!wasInWishlist);

    try {
      if (wasInWishlist) {
        await removeWishlistItem(product.slug);
      } else {
        await addWishlistItem(product);
      }
    } catch (err) {
      setInWishlist(wasInWishlist);
      toast.error(
        wasInWishlist ? "Could not remove from wishlist" : "Could not save to wishlist",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setPending(false);
    }
  }, [inWishlist, product]);

  return { inWishlist, pending, toggle };
}
