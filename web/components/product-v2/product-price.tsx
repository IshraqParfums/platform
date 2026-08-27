import { discountPercent, formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

/**
 * Price for the v2 PDP only.
 *
 * The shared `ui/price.tsx` is v1 chrome — `font-display`, `font-mono`,
 * `text-ink-faint` — and it's used by cart, shop and product cards, so
 * restyling it in place would repaint half the site. Same call as the size
 * selector: give the PDP its own presentation rather than leak v1 tokens
 * into the arrival or drag unrelated surfaces into this redesign. The money
 * formatting itself still comes from `lib/format/money`, so there is only
 * one source of truth for what a price *says* — this only changes how it
 * looks here.
 */
export function ProductPrice({
  pricePaise,
  compareAtPaise = null,
  sizeMl = null,
  size = "lg",
  className,
}: {
  pricePaise: number | null;
  compareAtPaise?: number | null;
  sizeMl?: number | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (pricePaise === null) {
    return (
      <span className={cn("text-[16px] text-graphite-soft", className)}>
        Coming soon
      </span>
    );
  }

  const off = discountPercent(pricePaise, compareAtPaise);

  return (
    <span className={cn("flex flex-col gap-1", className)}>
      <span className="flex flex-wrap items-baseline gap-x-2.5">
        <span
          className={cn(
            "font-editorial text-graphite",
            size === "lg" ? "text-[30px] leading-none" : "text-[19px] leading-none",
          )}
        >
          {formatPaise(pricePaise)}
        </span>
        {sizeMl != null ? (
          <span className="text-[15px] text-graphite-soft">{sizeMl} ml</span>
        ) : null}
      </span>

      {compareAtPaise && off ? (
        <span className="flex flex-wrap items-baseline gap-x-2 text-[14px]">
          {/* Strikethrough is the one place `graphite-faint` is right: it's
              chrome, and being quieter than the live price is the point. */}
          <span className="text-graphite-faint line-through">
            {formatPaise(compareAtPaise)}
          </span>
          <span className="text-terra">{off}% off</span>
        </span>
      ) : null}
    </span>
  );
}
