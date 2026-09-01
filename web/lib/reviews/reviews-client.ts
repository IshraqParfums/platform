import type {
  ReviewResponse,
  UpdateReviewBody,
} from "@ishraqparfums/shared";
import { apiErrorFrom } from "@/lib/api/api-error";
import { shopFetch } from "@/lib/auth/shop-fetch";
import type { ReviewDraft } from "@/lib/reviews/review-draft";

/**
 * Load the signed-in customer's review for a product.
 * `null` when signed out or no review yet (401 / 404).
 */
export async function getMyProductReview(
  slug: string,
): Promise<ReviewResponse | null> {
  const response = await shopFetch(
    `/api/products/${encodeURIComponent(slug)}/reviews/me`,
    { cache: "no-store" },
  );

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }

  return (await response.json()) as ReviewResponse;
}

export type CreateReviewResult =
  | { result: "ok"; review: ReviewResponse }
  | { result: "unauthorized" }
  | { result: "conflict" }
  | { result: "error"; message: string };

export async function createProductReview(
  draft: ReviewDraft,
): Promise<CreateReviewResult> {
  const response = await shopFetch(
    `/api/products/${encodeURIComponent(draft.slug)}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: draft.rating,
        ...(draft.body.trim() ? { body: draft.body.trim() } : {}),
      }),
    },
  );

  if (response.status === 401) return { result: "unauthorized" };
  if (response.status === 409) return { result: "conflict" };

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    return {
      result: "error",
      message: Array.isArray(data.message)
        ? data.message.join(" ")
        : (data.message ?? "Could not submit review"),
    };
  }

  const review = (await response.json()) as ReviewResponse;
  return { result: "ok", review };
}

export async function updateReview(
  reviewId: string,
  body: UpdateReviewBody,
): Promise<ReviewResponse> {
  const response = await shopFetch(
    `/api/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }

  return (await response.json()) as ReviewResponse;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const response = await shopFetch(
    `/api/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw await apiErrorFrom(response);
  }
}
