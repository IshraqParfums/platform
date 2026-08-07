import type { CartMutationSummary } from "@ishraqparfums/shared";
import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import type { GuestCartSnapshot } from "@/lib/cart/guest-cart";
import {
  withLineQuantity,
  type CartView,
  type CartViewLine,
} from "@/lib/cart/cart-view";

export type CartLineSeed = GuestCartSnapshot & { variantId: string };

/**
 * Merge a slim mutation ack into local cart state (PDP / optimistic clients).
 * Optional `seed` supplies display fields when the line is new (add-to-cart).
 */
export function applyCartMutationSummary(
  view: CartView,
  summary: CartMutationSummary,
  seed?: CartLineSeed,
): CartView {
  const existing = view.lines.find((line) => line.itemId === summary.itemId);
  const existingByVariant =
    !existing && summary.variantId
      ? view.lines.find((line) => line.variantId === summary.variantId)
      : null;
  const target = existing ?? existingByVariant ?? null;

  if (summary.quantity <= 0) {
    if (!target) {
      return recomputeView({ ...view, itemCount: summary.itemCount });
    }
    return {
      ...withLineQuantity(view, target.key, 0),
      cartId: summary.cartId,
      itemCount: summary.itemCount,
      mode: "server",
    };
  }

  if (target) {
    let next = withLineQuantity(view, target.key, summary.quantity);
    next = {
      ...next,
      cartId: summary.cartId,
      mode: "server",
      itemCount: summary.itemCount,
      lines: next.lines.map((line) => {
        if (line.key !== target.key) return line;
        return {
          ...line,
          itemId: summary.itemId,
          quantity: summary.quantity,
          lineTotalPaise:
            summary.lineTotalPaise ?? line.pricePaise * summary.quantity,
          stockQty:
            summary.stockQty != null ? summary.stockQty : line.stockQty,
          isAvailable:
            summary.stockQty != null
              ? summary.stockQty > 0
              : line.isAvailable,
        };
      }),
    };
    return recomputeView(next);
  }

  if (!seed || !summary.variantId) {
    return {
      ...view,
      cartId: summary.cartId,
      mode: "server",
      itemCount: summary.itemCount,
    };
  }

  const line: CartViewLine = {
    key: summary.itemId,
    kind: "catalog",
    itemId: summary.itemId,
    variantId: summary.variantId,
    quantity: summary.quantity,
    sizeMl: seed.sizeMl,
    pricePaise: seed.pricePaise,
    compareAtPricePaise: seed.compareAtPricePaise,
    stockQty: summary.stockQty ?? seed.stockQty,
    isAvailable: (summary.stockQty ?? seed.stockQty) > 0,
    unavailableReason:
      (summary.stockQty ?? seed.stockQty) > 0 ? null : "OUT_OF_STOCK",
    productName: seed.productName,
    productSlug: seed.productSlug,
    collectionName: seed.collectionName,
    shortDescription: seed.shortDescription,
    primaryImageUrl: seed.primaryImageUrl,
    lineTotalPaise:
      summary.lineTotalPaise ?? seed.pricePaise * summary.quantity,
  };

  return recomputeView({
    ...view,
    cartId: summary.cartId,
    mode: "server",
    itemCount: summary.itemCount,
    lines: [...view.lines, line],
  });
}

function recomputeView(view: CartView): CartView {
  const subtotalPaise = view.lines
    .filter((line) => line.isAvailable)
    .reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const hasSellable = view.lines.some(
    (line) => line.isAvailable && line.quantity > 0,
  );
  const shippingPaise = hasSellable ? SHIPPING_PAISE : 0;

  return {
    ...view,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
  };
}
