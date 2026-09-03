"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProductReviewsResponse,
  RatingBreakdown,
  ReviewResponse,
} from "@ishraqparfums/shared";
import { ProductReviewDeleteModal } from "@/components/product-v2/reviews/product-review-delete-modal";
import { ProductReviewList } from "@/components/product-v2/reviews/product-review-list";
import { ProductReviewSummary } from "@/components/product-v2/reviews/product-review-summary";
import { ProductReviewsEmpty } from "@/components/product-v2/reviews/product-reviews-empty";
import { ProductReviewWriteModal } from "@/components/product-v2/reviews/product-review-write-modal";
import { Button } from "@/components/ui/button";
import {
  clearReviewDraft,
  readReviewDraft,
} from "@/lib/reviews/review-draft";
import {
  createProductReview,
  getMyProductReview,
} from "@/lib/reviews/reviews-client";

/** Prevents Strict Mode double auto-submit for the same slug in one session. */
const resumedDraftSlugs = new Set<string>();

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
  const [writeOpen, setWriteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!mineReady || mine) return;
    const draft = readReviewDraft(slug);
    if (!draft || resumedDraftSlugs.has(slug)) return;
    resumedDraftSlugs.add(slug);

    let cancelled = false;

    void (async () => {
      const posted = await createProductReview(draft);
      if (cancelled) return;

      if (posted.result === "unauthorized") {
        resumedDraftSlugs.delete(slug);
        setWriteOpen(true);
        return;
      }
      if (posted.result === "conflict") {
        clearReviewDraft(slug);
        setResumeError("You’ve already reviewed this perfume.");
        return;
      }
      if (posted.result === "error") {
        resumedDraftSlugs.delete(slug);
        setResumeError(posted.message ?? "Could not submit review");
        setWriteOpen(true);
        return;
      }
      clearReviewDraft(slug);
      onCreated(posted.review);
    })();

    return () => {
      cancelled = true;
    };
  }, [mineReady, mine, slug, onCreated]);

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
    setWriteOpen(false);
    setDeleteOpen(false);
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

  const onPageChange = useCallback((data: ProductReviewsResponse) => {
    setItems(data.items);
    setPage(data.page);
    setTotal(data.total);
    setRatingAverage(data.ratingAverage);
    setRatingCount(data.ratingCount);
    setBreakdown(data.ratingBreakdown);
  }, []);

  const hasReviews = ratingCount > 0;

  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {hasReviews ? (
          <ProductReviewSummary
            average={ratingAverage}
            count={ratingCount}
            breakdown={breakdown}
            className="min-w-0 flex-1"
          />
        ) : (
          <h2 className="font-editorial text-h3-editorial text-graphite">
            Be the first to review
          </h2>
        )}
        {mineReady ? (
          <Button
            type="button"
            variant="outline-paper"
            size="md"
            className="cursor-pointer"
            onClick={() => setWriteOpen(true)}
          >
            {mine ? "Edit your review" : "Add review"}
          </Button>
        ) : null}
      </div>

      {resumeError ? (
        <p className="mt-4 text-sm text-rose-deep">{resumeError}</p>
      ) : null}

      <div className="mt-8">
        {hasReviews ? (
          <ProductReviewList
            slug={slug}
            items={items}
            total={total}
            page={page}
            pageSize={initial.pageSize}
            mine={mine}
            onPageChange={onPageChange}
            onEditMine={() => setWriteOpen(true)}
            onDeleteMine={() => setDeleteOpen(true)}
          />
        ) : (
          <ProductReviewsEmpty />
        )}
      </div>

      <ProductReviewWriteModal
        open={writeOpen}
        slug={slug}
        review={mine}
        onClose={() => setWriteOpen(false)}
        onCreated={onCreated}
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
