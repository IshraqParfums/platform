"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProductReviewsResponse,
  RatingBreakdown,
  ReviewResponse,
} from "@ishraqparfums/shared";
import { ProductReviewCard } from "@/components/product/product-review-card";
import { ProductReviewDeleteModal } from "@/components/product/product-review-delete-modal";
import { ProductReviewEditModal } from "@/components/product/product-review-edit-modal";
import { ProductReviewForm } from "@/components/product/product-review-form";
import { ProductReviewList } from "@/components/product/product-review-list";
import { ProductReviewSummary } from "@/components/product/product-review-summary";
import { SectionHeading } from "@/components/ui/section-heading";
import { getMyProductReview } from "@/lib/reviews/reviews-client";

/**
 * PDP reviews: sticky left = Reviews heading + rating summary + write/yours;
 * right = community feed (or empty illustration when none).
 *
 * Community `items`/`total` come from Nest with the viewer already excluded
 * when signed in — no client-side list filtering.
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
  const [mine, setMine] = useState<ReviewResponse | null>(null);
  const [mineReady, setMineReady] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getMyProductReview(slug)
      .then((review) => {
        if (!cancelled) setMine(review);
      })
      .catch(() => {
        if (!cancelled) setMine(null);
      })
      .finally(() => {
        if (!cancelled) setMineReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onCreated = useCallback((review: ReviewResponse) => {
    setMine(review);
    // Community list already excludes the viewer; totals stay put.
    // Aggregates include everyone — bump those only.
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

  const onUpdated = useCallback(
    (updated: ReviewResponse) => {
      const previous = mine;
      setMine(updated);

      if (previous && previous.rating !== updated.rating) {
        setBreakdown((prev) => ({
          ...prev,
          [previous.rating as 1 | 2 | 3 | 4 | 5]: Math.max(
            0,
            prev[previous.rating as 1 | 2 | 3 | 4 | 5] - 1,
          ),
          [updated.rating as 1 | 2 | 3 | 4 | 5]:
            prev[updated.rating as 1 | 2 | 3 | 4 | 5] + 1,
        }));
        setRatingAverage((prevAvg) => {
          if (ratingCount <= 0) return prevAvg;
          const sum =
            (prevAvg ?? 0) * ratingCount - previous.rating + updated.rating;
          return Math.round((sum / ratingCount) * 10) / 10;
        });
      }
    },
    [mine, ratingCount],
  );

  const onDeleted = useCallback((removed: ReviewResponse) => {
    setMine(null);
    setEditOpen(false);
    setDeleteOpen(false);
    // Viewer’s review was never in community `total` — only aggregates change.
    setRatingCount((prev) => {
      const nextCount = Math.max(0, prev - 1);
      setRatingAverage((prevAvg) => {
        if (prev <= 1) return null;
        const sum = (prevAvg ?? 0) * prev - removed.rating;
        return Math.round((sum / nextCount) * 10) / 10;
      });
      return nextCount;
    });
    setBreakdown((prev) => ({
      ...prev,
      [removed.rating as 1 | 2 | 3 | 4 | 5]: Math.max(
        0,
        prev[removed.rating as 1 | 2 | 3 | 4 | 5] - 1,
      ),
    }));
  }, []);

  /** Replace the current page — never append (numbered pagination). */
  const onPageChange = useCallback((data: ProductReviewsResponse) => {
    setItems(data.items);
    setPage(data.page);
    setTotal(data.total);
    setRatingAverage(data.ratingAverage);
    setRatingCount(data.ratingCount);
    setBreakdown(data.ratingBreakdown);
  }, []);

  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading title="Reviews" />

          <ProductReviewSummary
            average={ratingAverage}
            count={ratingCount}
            breakdown={breakdown}
            className="mt-6"
          />

          <div className={ratingCount > 0 ? "mt-8" : "mt-6"}>
            {!mineReady ? (
              <p className="font-mono text-label-sm uppercase text-ink-faint">
                Checking your review…
              </p>
            ) : mine ? (
              <div className="space-y-3">
                <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                  Your review
                </p>
                <ProductReviewCard
                  review={mine}
                  mine
                  onEdit={() => setEditOpen(true)}
                  onDelete={() => setDeleteOpen(true)}
                />
              </div>
            ) : (
              <ProductReviewForm slug={slug} onCreated={onCreated} />
            )}
          </div>
        </aside>

        <div className="min-w-0">
          <ProductReviewList
            slug={slug}
            items={items}
            total={total}
            page={page}
            pageSize={initial.pageSize}
            ratingCount={ratingCount}
            onPageChange={onPageChange}
          />
        </div>
      </div>

      <ProductReviewEditModal
        open={editOpen}
        review={mine}
        onClose={() => setEditOpen(false)}
        onSaved={onUpdated}
      />

      <ProductReviewDeleteModal
        open={deleteOpen}
        review={mine}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onDeleted}
      />
    </section>
  );
}
