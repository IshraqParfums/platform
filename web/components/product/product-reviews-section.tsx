"use client";

import { useCallback, useState } from "react";
import type {
  ProductReviewsResponse,
  RatingBreakdown,
  ReviewResponse,
} from "@ishraqparfums/shared";
import { ProductReviewForm } from "@/components/product/product-review-form";
import { ProductReviewList } from "@/components/product/product-review-list";
import { ProductReviewsEmpty } from "@/components/product/product-reviews-empty";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * PDP reviews block — summary/list + write form.
 * Desktop: list | form. Mobile: list then form with a clear divider (no dead gap).
 */
export function ProductReviewsSection({
  slug,
  initial,
}: {
  slug: string;
  initial: ProductReviewsResponse;
}) {
  const [items, setItems] = useState<ReviewResponse[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [total, setTotal] = useState(initial.total);
  const [ratingAverage, setRatingAverage] = useState(initial.ratingAverage);
  const [ratingCount, setRatingCount] = useState(initial.ratingCount);
  const [breakdown, setBreakdown] = useState<RatingBreakdown>(
    initial.ratingBreakdown,
  );

  const hasReviews = ratingCount > 0;

  const onCreated = useCallback((review: ReviewResponse) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === review.id)) return prev;
      return [review, ...prev];
    });
    setTotal((prev) => prev + 1);
    setRatingCount((prev) => {
      const nextCount = prev + 1;
      setRatingAverage((prevAvg) => {
        const sum = (prevAvg ?? 0) * prev + review.rating;
        return Math.round((sum / nextCount) * 10) / 10;
      });
      return nextCount;
    });
    setBreakdown((prev) => ({
      ...prev,
      [review.rating as 1 | 2 | 3 | 4 | 5]:
        prev[review.rating as 1 | 2 | 3 | 4 | 5] + 1,
    }));
  }, []);

  const onPageLoaded = useCallback((data: ProductReviewsResponse) => {
    setItems((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      return [...prev, ...data.items.filter((item) => !seen.has(item.id))];
    });
    setPage(data.page);
    setTotal(data.total);
    setRatingAverage(data.ratingAverage);
    setRatingCount(data.ratingCount);
    setBreakdown(data.ratingBreakdown);
  }, []);

  return (
    <section id="reviews" className="scroll-mt-28">
      <SectionHeading title="Reviews" />

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        {hasReviews ? (
          <ProductReviewList
            slug={slug}
            items={items}
            total={total}
            page={page}
            pageSize={initial.pageSize}
            ratingAverage={ratingAverage}
            ratingCount={ratingCount}
            breakdown={breakdown}
            onPageLoaded={onPageLoaded}
          />
        ) : (
          <ProductReviewsEmpty />
        )}

        <div className="border-t border-ink/10 pt-6 lg:border-t-0 lg:pt-0">
          <ProductReviewForm slug={slug} onCreated={onCreated} />
        </div>
      </div>
    </section>
  );
}
