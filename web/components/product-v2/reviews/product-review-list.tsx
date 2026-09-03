"use client";

import { useState, useTransition } from "react";
import type {
  ProductReviewsResponse,
  ReviewResponse,
} from "@ishraqparfums/shared";
import { ProductReviewCard } from "@/components/product-v2/reviews/product-review-card";
import { PaginationControls } from "@/components/ui/pagination-controls";

/**
 * Community reviews as a single column of quotes. Page changes replace the list.
 */
export function ProductReviewList({
  slug,
  items,
  total,
  page,
  pageSize,
  mine,
  onPageChange,
  onEditMine,
  onDeleteMine,
}: {
  slug: string;
  items: ReviewResponse[];
  total: number;
  page: number;
  pageSize: number;
  mine: ReviewResponse | null;
  onPageChange: (data: ProductReviewsResponse) => void;
  onEditMine: () => void;
  onDeleteMine: () => void;
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
        document
          .getElementById("reviews")
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      } catch {
        setError("Could not load reviews.");
      }
    });
  }

  const showMine = Boolean(mine) && page === 1;

  return (
    <div>
      <div className="divide-y divide-graphite/10 border-t border-graphite/10">
        {showMine && mine ? (
          <ProductReviewCard
            review={mine}
            mine
            onEdit={onEditMine}
            onDelete={onDeleteMine}
          />
        ) : null}
        {items.map((review) => (
          <ProductReviewCard key={review.id} review={review} />
        ))}
      </div>

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
