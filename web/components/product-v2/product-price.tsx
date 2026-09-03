import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

/**
 * Price for the v2 PDP only — live price and size, nothing else.
 *
 * Compare-at / "% off" lives in admin and in the cart snapshot if needed;
 * the product page does not advertise a strike-through.
 */
export function ProductPrice({
  pricePaise,
  sizeMl = null,
  size = "lg",
  className,
}: {
  pricePaise: number | null;
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

  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2.5", className)}>
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
  );
}
