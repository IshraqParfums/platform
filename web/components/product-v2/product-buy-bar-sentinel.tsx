"use client";

import { useProductPurchase } from "@/components/product-v2/purchase-context";

/**
 * Marks the end of the product content, so the phone buy strip can retire
 * before the footer rather than floating over it.
 *
 * The strip is `position: fixed`, so it sits above whatever scrolls under it —
 * including the footer's own links, which is what this fixes. Watching a
 * sentinel here rather than watching the footer itself keeps the change
 * entirely inside the PDP: `Footer` and the shop layout are shared with every
 * other route and stay untouched.
 *
 * It also happens to be the honest rule. The strip exists for "you're mid-page
 * and might want to buy"; once the record has been read to the end, that job
 * is done and it should get out of the way.
 */
export function ProductBuyBarSentinel() {
  const { setEndAnchor } = useProductPurchase();
  return <div ref={setEndAnchor} aria-hidden="true" className="h-px w-full" />;
}
