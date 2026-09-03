import type { RatingBreakdown } from "@ishraqparfums/shared";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/cn";

/**
 * Scoreboard: the number is the section title, the bars are the chart.
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

  const reviewWord = count === 1 ? "review" : "reviews";

  return (
    <div
      className={cn(
        "flex flex-col gap-8 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-x-14",
        className,
      )}
    >
      <div>
        <p className="font-editorial text-[clamp(40px,6vw,56px)] leading-none tracking-[-0.03em] text-graphite">
          {average.toFixed(1)}
        </p>
        <h2 className="mt-2 font-editorial text-[22px] leading-[1.2] text-graphite">
          {count} {reviewWord}
        </h2>
        <div className="mt-2 text-terra">
          <Rating average={average} count={count} showValue={false} />
        </div>
      </div>

      <div className="w-full space-y-2">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const value = breakdown[star];
          const width = `${(value / maxBar) * 100}%`;
          return (
            <div
              key={star}
              className="flex items-center gap-2.5 text-[13px] text-graphite-soft"
            >
              <span className="w-3 tabular-nums">{star}</span>
              <div className="h-2 flex-1 bg-graphite/10">
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
