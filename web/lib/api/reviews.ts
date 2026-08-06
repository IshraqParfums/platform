import 'server-only';

import type { ProductReviewsResponse } from '@ishraqparfums/shared';
import { shopAuthFetch } from '@/lib/api/auth-fetch';
import { nestFetch } from '@/lib/api/nest';
import { getShopAccessToken } from '@/lib/auth/session';

const REVIEWS_REVALIDATE_SECONDS = 60;

const EMPTY_REVIEWS: ProductReviewsResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  ratingAverage: null,
  ratingCount: 0,
  ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

/**
 * Product community reviews for the PDP.
 * Forwards the shop session when present so Nest can exclude the viewer’s
 * own review from `items`/`total`. Authenticated responses are never cached.
 */
export async function getProductReviews(
  slug: string,
  params?: { page?: number; pageSize?: number },
): Promise<ProductReviewsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  const path = `/products/${encodeURIComponent(slug)}/reviews${qs ? `?${qs}` : ''}`;

  try {
    const accessToken = await getShopAccessToken();
    if (accessToken) {
      const { data } = await shopAuthFetch<ProductReviewsResponse>(path, {
        cache: 'no-store',
      });
      return data;
    }

    const { data } = await nestFetch<ProductReviewsResponse>(path, {
      next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
    });
    return data;
  } catch {
    return {
      ...EMPTY_REVIEWS,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    };
  }
}
