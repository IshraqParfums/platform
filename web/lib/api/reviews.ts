import 'server-only';

import type { ProductReviewsResponse } from '@ishraqparfums/shared';
import { nestFetch } from '@/lib/api/nest';

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
 * Public product reviews for the PDP. Degrades to empty on failure.
 */
export async function getProductReviews(
  slug: string,
  params?: { page?: number; pageSize?: number },
): Promise<ProductReviewsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();

  try {
    const { data } = await nestFetch<ProductReviewsResponse>(
      `/products/${encodeURIComponent(slug)}/reviews${qs ? `?${qs}` : ''}`,
      { next: { revalidate: REVIEWS_REVALIDATE_SECONDS } },
    );
    return data;
  } catch {
    return {
      ...EMPTY_REVIEWS,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    };
  }
}
