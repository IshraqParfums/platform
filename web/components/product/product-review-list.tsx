"use client";

import { useState, useTransition } from "react";
import type {
  ProductReviewsResponse,
  RatingBreakdown,
  ReviewResponse,
} from "@ishraqparfums/shared";
import { ProductReviewCard } from "@/components/product/product-review-card";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";

/**
 * Review summary, breakdown bars, list, and load-more pagination.
 */
export function ProductReviewList({
  slug,
  items,
  total,
  page,
  pageSize,
  ratingAverage,
  ratingCount,
  breakdown,
  onPageLoaded,
}: {
  slug: string;
  items: ReviewResponse[];
  total: number;
  page: number;
  pageSize: number;
  ratingAverage: number | null;
  ratingCount: number;
  breakdown: RatingBreakdown;
  onPageLoaded: (data: ProductReviewsResponse) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasMore = items.length < total;

  function onLoadMore() {
    setError(null);
    startTransition(async () => {
      try {
        const nextPage = page + 1;
        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}/reviews?page=${nextPage}&pageSize=${pageSize}`,
        );
        if (!response.ok) {
          setError("Could not load more reviews.");
          return;
        }
        const data = (await response.json()) as ProductReviewsResponse;
        onPageLoaded(data);
      } catch {
        setError("Could not load more reviews.");
      }
    });
  }

  return (
    <div>
      <ReviewSummary
        average={ratingAverage}
        count={ratingCount}
        breakdown={breakdown}
      />

      {items.length === 0 ? null : (
        <div className="mt-5 space-y-3">
          {items.map((review) => (
            <ProductReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={isPending}
            onClick={onLoadMore}
          >
            {isPending ? "Loading…" : "Load more reviews"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}
    </div>
  );
}

function ReviewSummary({
  average,
  count,
  breakdown,
}: {
  average: number | null;
  count: number;
  breakdown: RatingBreakdown;
}) {
  const maxBar = Math.max(1, ...Object.values(breakdown));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
      <div className="shrink-0">
        {count > 0 && average !== null ? (
          <>
            <p className="font-display text-3xl font-semibold text-ink">
              {average.toFixed(1)}
            </p>
            <div className="mt-1.5">
              <Rating average={average} count={count} />
            </div>
          </>
        ) : (
          <Rating average={average} count={count} showEmpty />
        )}
      </div>

      {count > 0 ? (
        <div className="w-full max-w-sm space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const value = breakdown[star];
            const width = `${(value / maxBar) * 100}%`;
            return (
              <div
                key={star}
                className="flex items-center gap-2.5 font-mono text-label-sm text-ink-faint"
              >
                <span className="w-3 tabular-nums">{star}</span>
                <div className="h-1.5 flex-1 bg-ink/8">
                  <div
                    className="h-full bg-gold/80 transition-[width] duration-300"
                    style={{ width }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{value}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
