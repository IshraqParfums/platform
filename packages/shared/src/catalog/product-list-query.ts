import type { PaginationQuery } from "../pagination/pagination-contracts.js";

export const PRODUCT_LIST_SORTS = [
  "newest",
  "price-asc",
  "price-desc",
  "name-asc",
] as const;

export type ProductListSort = (typeof PRODUCT_LIST_SORTS)[number];

export const PRODUCT_LIST_SORT_DEFAULT: ProductListSort = "newest";

export function isProductListSort(value: unknown): value is ProductListSort {
  return (
    typeof value === "string" &&
    (PRODUCT_LIST_SORTS as readonly string[]).includes(value)
  );
}

export interface PublicProductListQuery extends PaginationQuery {
  collection?: string;
  q?: string;
  sort?: ProductListSort;
}
