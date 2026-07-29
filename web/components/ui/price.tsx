import { discountPercent, formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

/**
 * Single source of truth for money on the storefront. Handles the "from" prefix
 * used wherever a product has several variants, and the compare-at strikethrough.
 */
export function Price({
  pricePaise,
  compareAtPaise = null,
  from = false,
  size = "md",
  className,
}: {
  pricePaise: number | null;
  compareAtPaise?: number | null;
  from?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (pricePaise === null) {
    return (
      <span className={cn("text-sm text-ink-faint", className)}>
        Coming soon
      </span>
    );
  }

  const off = discountPercent(pricePaise, compareAtPaise);
  const scale =
    size === "lg"
      ? "text-2xl sm:text-[28px]"
      : size === "sm"
        ? "text-sm"
        : "text-base";

  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      {from && (
        <span className="font-mono text-label-sm uppercase text-ink-faint">
          from
        </span>
      )}
      <span className={cn("font-display font-semibold", scale)}>
        {formatPaise(pricePaise)}
      </span>
      {compareAtPaise && off ? (
        <>
          <span className="text-sm text-ink-faint line-through">
            {formatPaise(compareAtPaise)}
          </span>
          <span className="font-mono text-label-sm uppercase text-rose-deep">
            {off}% off
          </span>
        </>
      ) : null}
    </span>
  );
}
