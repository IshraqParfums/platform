import {
  PRODUCT_LIST_SORT_DEFAULT,
  isProductListSort,
  type ProductListSort,
} from "@ishraqparfums/shared";

export type ShopQuery = {
  collection?: string;
  q?: string;
  sort: ProductListSort;
  page: number;
};

export function parseShopSort(value: string | undefined): ProductListSort {
  return isProductListSort(value) ? value : PRODUCT_LIST_SORT_DEFAULT;
}

export function parseShopPage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Build a `/shop` href from filter/sort state. Omits defaults to keep URLs tidy. */
export function buildShopHref(params: {
  collection?: string;
  q?: string;
  sort?: ProductListSort;
  page?: number;
}): string {
  const qs = new URLSearchParams();

  if (params.collection) qs.set("collection", params.collection);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.sort && params.sort !== PRODUCT_LIST_SORT_DEFAULT) {
    qs.set("sort", params.sort);
  }
  if (params.page && params.page > 1) qs.set("page", String(params.page));

  const serialized = qs.toString();
  return serialized ? `/shop?${serialized}` : "/shop";
}
