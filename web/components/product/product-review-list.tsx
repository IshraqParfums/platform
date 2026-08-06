"use client";

import { useState, useTransition } from "react";
import type {
  ProductReviewsResponse,
  ReviewResponse,
} from "@ishraqparfums/shared";
import { ProductReviewCard } from "@/components/product/product-review-card";
import { ProductReviewsEmpty } from "@/components/product/product-reviews-empty";
import { PaginationControls } from "@/components/ui/pagination-controls";

/**
 * Community column only: newest-first list + numbered pages.
 * Rating summary lives in the sticky left column.
 * Page changes replace the list (10 per page) — they do not append.
 */
export function ProductReviewList({
  slug,
  items,
  total,
  page,
  pageSize,
  ratingCount,
  onPageChange,
}: {
  slug: string;
  items: ReviewResponse[];
  total: number;
  page: number;
  pageSize: number;
  ratingCount: number;
  onPageChange: (data: ProductReviewsResponse) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function goToPage(nextPage: number) {
    if (nextPage === page || nextPage < 1) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}/reviews?page=${nextPage}&pageSize=${pageSize}`,
        );
        if (!response.ok) {
          setError("Could not load reviews.");
          return;
        }
        const data = (await response.json()) as ProductReviewsResponse;
        onPageChange(data);
        // Pin scroll after list height changes (shorter pages used to dump
        // the viewport into related products / footer).
        document
          .getElementById("reviews")
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      } catch {
        setError("Could not load reviews.");
      }
    });
  }

  if (ratingCount === 0) {
    return <ProductReviewsEmpty variant="none" />;
  }

  if (total === 0) {
    return <ProductReviewsEmpty variant="only-yours" />;
  }

  return (
    <div>
      <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        Most recent
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-[15px] text-ink-soft">
          {isPending ? "Loading reviews…" : "No reviews on this page."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((review) => (
            <ProductReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        pending={isPending}
        onPageChange={goToPage}
      />

      {error ? <p className="mt-3 text-sm text-rose-deep">{error}</p> : null}
    </div>
  );
}
