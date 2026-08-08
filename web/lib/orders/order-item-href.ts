import type { OrderItemResponse } from "@ishraqparfums/shared";

/** Href for an order line name, or null when the line should not link. */
export function orderItemHref(item: OrderItemResponse): string | null {
  if (item.kind === "bespoke") {
    return item.bespokePerfumeId
      ? `/bespoke/brews/${item.bespokePerfumeId}`
      : null;
  }
  if (!item.productSlug || item.productSlug === "bespoke") return null;
  return `/products/${item.productSlug}`;
}
