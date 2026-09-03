"use client";

import type { ProductListItem } from "@ishraqparfums/shared";
import { Heart } from "lucide-react";
import { useWishlistItem } from "@/lib/wishlist/use-wishlist-item";
import { cn } from "@/lib/cn";

/**
 * The one heart toggle, in two visual registers:
 * - `overlay` — a circular scrim over photography (shop listing, catalog
 *   cards), legible regardless of what's underneath.
 * - `inline` — a plain icon button on paper (PDP, trailing the Urdu row),
 *   no backdrop, colours matching the surrounding page.
 */
export function WishlistHeartButton({
  product,
  variant = "overlay",
  className,
}: {
  product: ProductListItem;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const { inWishlist, pending, toggle } = useWishlistItem(product);

  return (
    <button
      type="button"
      aria-label={
        inWishlist
          ? `Remove ${product.name} from wishlist`
          : `Save ${product.name} to wishlist`
      }
      aria-pressed={inWishlist}
      disabled={pending}
      onClick={(event) => {
        event.stopPropagation();
        void toggle();
      }}
      className={cn(
        "flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 disabled:cursor-default",
        variant === "overlay"
          ? "h-9 w-9 bg-graphite/45 text-cream-soft backdrop-blur-sm hover:bg-graphite/60"
          : "h-10 w-10 text-graphite-faint hover:bg-graphite/[0.06] hover:text-terra",
        className,
      )}
    >
      <Heart
        aria-hidden
        strokeWidth={1.75}
        className={cn(
          variant === "overlay" ? "h-[18px] w-[18px]" : "h-[22px] w-[22px]",
          inWishlist && "fill-current",
          inWishlist && variant === "inline" && "text-terra",
        )}
      />
    </button>
  );
}
