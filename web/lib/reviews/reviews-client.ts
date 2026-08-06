import type {
  ReviewResponse,
  UpdateReviewBody,
} from "@ishraqparfums/shared";
import { apiErrorFrom } from "@/lib/api/api-error";
import { shopFetch } from "@/lib/auth/shop-fetch";

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
