"use client";

import type { ProductListItem } from "@ishraqparfums/shared";
import { useWishlistItem } from "@/lib/wishlist/use-wishlist-item";
import { cn } from "@/lib/cn";

/**
 * The one heart toggle, in two visual registers:
 * - `overlay` — a circular scrim over photography (shop listing, catalog
 *   cards), legible regardless of what's underneath.
 * - `inline` — a plain icon button on paper (PDP, next to "Add to cart"),
 *   no backdrop, colours matching the surrounding page.
 *
 * A hand-drawn SVG, not `lucide-react` — this is repeated brand chrome
 * (every card, every PDP), the same register as `CartNavLink`'s bag icon.
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
        "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 disabled:cursor-default",
        variant === "overlay"
          ? "bg-graphite/45 text-cream-soft backdrop-blur-sm hover:bg-graphite/60"
          : "text-graphite-faint hover:bg-graphite/[0.06] hover:text-terra",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={inWishlist ? "currentColor" : "none"}
        className={cn(
          "h-[18px] w-[18px] scale-100 transition-transform duration-200 motion-reduce:transition-none",
          inWishlist && "scale-110 text-terra",
        )}
        aria-hidden="true"
      >
        <path
          d="M12 20.3s-7.3-4.5-9.8-9C.8 7.8 2.3 4.5 5.4 4.5c1.9 0 3.5 1.1 4.6 2.7 1.1-1.6 2.7-2.7 4.6-2.7 3.1 0 4.6 3.3 3.2 6.8-2.5 4.5-9.8 9-9.8 9z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
