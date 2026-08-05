import { discountPercent, formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

/**
 * Single source of truth for money on the storefront.
 *
 * Prefer `sizeMl` for catalog cards (`₹1,699 · 30 ml`) over a vague "from"
 * prefix. `layout="stacked"` puts MRP / % off on a second line.
 */
export function Price({
  pricePaise,
  compareAtPaise = null,
  sizeMl = null,
  from = false,
  size = "md",
  layout = "inline",
  className,
}: {
  pricePaise: number | null;
  compareAtPaise?: number | null;
  /** When set, shows `₹… · {n} ml` instead of a "from" label. */
  sizeMl?: number | null;
  /** Legacy prefix when size is unknown. Prefer `sizeMl`. */
  from?: boolean;
  size?: "sm" | "md" | "lg";
  layout?: "inline" | "stacked";
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
        : "text-lg";

  const sale = (
    <span className="flex flex-wrap items-baseline gap-x-2">
      {sizeMl == null && from ? (
        <span className="font-mono text-label-sm uppercase text-ink-faint">
          from
        </span>
      ) : null}
      <span className={cn("font-display font-semibold", scale)}>
        {formatPaise(pricePaise)}
      </span>
      {sizeMl != null ? (
        <span className="text-[13px] text-ink-faint">· {sizeMl} ml</span>
      ) : null}
    </span>
  );

  const discount =
    compareAtPaise && off ? (
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm text-ink-faint line-through">
          {layout === "stacked"
            ? `MRP ${formatPaise(compareAtPaise)}`
            : formatPaise(compareAtPaise)}
        </span>
        <span className="font-mono text-label-sm uppercase text-rose-deep">
          {off}% off
        </span>
      </span>
    ) : null;

  if (layout === "stacked") {
    return (
      <span className={cn("flex flex-col gap-0.5", className)}>
        {sale}
        {discount}
      </span>
    );
  }

  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      {sizeMl == null && from ? (
        <span className="font-mono text-label-sm uppercase text-ink-faint">
          from
        </span>
      ) : null}
      <span className={cn("font-display font-semibold", scale)}>
        {formatPaise(pricePaise)}
      </span>
      {sizeMl != null ? (
        <span className="text-[13px] text-ink-faint">· {sizeMl} ml</span>
      ) : null}
      {discount}
    </span>
  );
}
