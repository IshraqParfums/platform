import 'server-only';

import type {
  CollectionSummary,
  PaginatedResponse,
  ProductListItem,
} from '@ishraqparfums/shared';
import { nestFetch } from '@/lib/api/nest';

/** Public catalog changes rarely; serve from cache and revalidate in the background. */
const CATALOG_REVALIDATE_SECONDS = 300;

/**
 * The storefront must never hard-fail because the API is briefly unavailable —
 * sections degrade to empty states instead of throwing a 500 for the whole page.
 */
async function safe<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch {
    return fallback;
  }
}

export function getCollections(): Promise<CollectionSummary[]> {
  return safe(async () => {
    const { data } = await nestFetch<CollectionSummary[]>('/collections', {
      next: { revalidate: CATALOG_REVALIDATE_SECONDS },
    });
    return data;
  }, []);
}

export function getProducts(params?: {
  collection?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ProductListItem>> {
  const search = new URLSearchParams();
  if (params?.collection) search.set('collection', params.collection);
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();

  return safe(
    async () => {
      const { data } = await nestFetch<PaginatedResponse<ProductListItem>>(
        `/products${qs ? `?${qs}` : ''}`,
        { next: { revalidate: CATALOG_REVALIDATE_SECONDS } },
      );
      return data;
    },
    { items: [], total: 0, page: 1, pageSize: params?.pageSize ?? 0 },
  );
}

/**
 * Homepage ranking. There is no `isFeatured` flag on Product yet, so we surface
 * reviewed products first (social proof sells), then fall back to catalog order.
 */
export async function getFeaturedProducts(
  limit = 4,
): Promise<ProductListItem[]> {
  const { items } = await getProducts({ pageSize: 24 });

  return [...items]
    .sort((a, b) => {
      const ar = a.reviewCount > 0 ? 1 : 0;
      const br = b.reviewCount > 0 ? 1 : 0;
      if (ar !== br) return br - ar;
      return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
    })
    .slice(0, limit);
}
