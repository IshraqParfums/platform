import type { RatingBreakdown } from "@ishraqparfums/shared";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/cn";

/**
 * Product rating average + star histogram.
 * Stacked by default for the sticky left reviews column.
 * Ported from product/product-review-summary.tsx, retinted.
 */
export function ProductReviewSummary({
  average,
  count,
  breakdown,
  className,
}: {
  average: number | null;
  count: number;
  breakdown: RatingBreakdown;
  className?: string;
}) {
  const maxBar = Math.max(1, ...Object.values(breakdown));

  if (count === 0 || average === null) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <p className="font-editorial text-3xl text-graphite">
          {average.toFixed(1)}
        </p>
        <div className="mt-1.5">
          <Rating average={average} count={count} />
        </div>
      </div>

      <div className="w-full space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const value = breakdown[star];
          const width = `${(value / maxBar) * 100}%`;
          return (
            <div
              key={star}
              className="flex items-center gap-2.5 text-[13px] text-graphite-soft"
            >
              <span className="w-3 tabular-nums">{star}</span>
              <div className="h-1.5 flex-1 bg-graphite/10">
                <div
                  className="h-full bg-terra/80 transition-[width] duration-300"
                  style={{ width }}
                />
              </div>
              <span className="w-6 text-right tabular-nums">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
