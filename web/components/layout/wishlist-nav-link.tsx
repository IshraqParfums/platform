"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWishlistedSlugs } from "@/lib/wishlist/wishlist-client";
import { subscribeWishlistChanged } from "@/lib/wishlist/wishlist-events";
import { cn } from "@/lib/cn";

/**
 * Header heart with a live count badge — desktop only (`hidden md:block` at
 * the call site in `header.tsx`), matching `BespokeSavedNavLink`. The mobile
 * header already carries shop + account + cart + hamburger; the client's own
 * ask was account nav and the mobile nav *list*, not a fifth phone icon.
 *
 * Structurally like `CartNavLink`, but reads the already-cached
 * `getWishlistedSlugs()` set instead of cloning its full `GET /api/cart`
 * fetch — a count is all this needs.
 */
export type WishlistNavTone = "dark" | "light";

const CONTROL: Record<WishlistNavTone, string> = {
  dark: "text-cream/85 hover:bg-cream/10 hover:text-cream-soft",
  light: "text-graphite/75 hover:bg-graphite/[0.06] hover:text-graphite",
};

const BADGE: Record<WishlistNavTone, string> = {
  dark: "bg-gold text-deep",
  light: "bg-indigo text-shell",
};

export function WishlistNavLink({ tone = "dark" }: { tone?: WishlistNavTone }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getWishlistedSlugs().then((slugs) => {
      if (!cancelled) setCount(slugs.size);
    });
    const unsubscribe = subscribeWishlistChanged(({ slugs }) => {
      if (!cancelled) setCount(slugs.size);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const label =
    count > 0 ? `Wishlist, ${count > 9 ? "9+" : count} items` : "Wishlist";

  return (
    <Link
      href="/wishlist"
      aria-label={label}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        CONTROL[tone],
      )}
    >
      <svg
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        className="h-[19px] w-[19px]"
        aria-hidden="true"
      >
        <path
          d="M12 20.3s-7.3-4.5-9.8-9C.8 7.8 2.3 4.5 5.4 4.5c1.9 0 3.5 1.1 4.6 2.7 1.1-1.6 2.7-2.7 4.6-2.7 3.1 0 4.6 3.3 3.2 6.8-2.5 4.5-9.8 9-9.8 9z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {count > 0 ? (
        <span
          className={cn(
            "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-semibold leading-none",
            BADGE[tone],
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
