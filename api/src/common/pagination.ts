import type { PaginatedResponse } from '@ishraqparfums/shared';
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from '@ishraqparfums/shared';

export function normalizePagination(
  page?: number,
  pageSize?: number,
): { page: number; pageSize: number } {
  const safePage =
    typeof page === 'number' && Number.isInteger(page) && page >= 1
      ? page
      : PAGINATION_DEFAULT_PAGE;

  const safePageSize =
    typeof pageSize === 'number' &&
    Number.isInteger(pageSize) &&
    pageSize >= 1 &&
    pageSize <= PAGINATION_MAX_PAGE_SIZE
      ? pageSize
      : PAGINATION_DEFAULT_PAGE_SIZE;

  return { page: safePage, pageSize: safePageSize };
}

export function toSkipTake(
  page?: number,
  pageSize?: number,
): { skip: number; take: number; page: number; pageSize: number } {
  const normalized = normalizePagination(page, pageSize);

  return {
    skip: (normalized.page - 1) * normalized.pageSize,
    take: normalized.pageSize,
    page: normalized.page,
    pageSize: normalized.pageSize,
  };
}

export function toPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    pageSize,
  };
}
