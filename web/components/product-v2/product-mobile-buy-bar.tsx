"use client";

import { ProductPrice } from "@/components/product-v2/product-price";
import { useProductPurchase } from "@/components/product-v2/purchase-context";
import { ViewCartLink } from "@/components/cart/view-cart-link";
import { Button } from "@/components/ui/button";

/**
 * Sticky buy bar — mobile only, and the only sticky element on the page.
 *
 * The v1 PDP pinned the *gallery* for the entire scroll, which kept the page
 * in shop-mode the whole way down. This inverts that: media never pins, and
 * the thing that follows you is the one thing you might actually want at any
 * point — the ability to buy.
 *
 * Deliberately minimal: name, price, one action. No size selection here —
 * it acts on the same variant already selected in the arrival (shared via
 * `purchase-context`), so there is exactly one selected size on the page and
 * no second add-to-cart path. Hidden entirely when the product isn't
 * buyable, and while the arrival's own CTA is still on screen.
 */
export function ProductMobileBuyBar() {
  const {
    selected,
    purchasable,
    inCart,
    isPending,
    cartReady,
    ctaState,
    addSelectedToCart,
    product,
    buyBarSuppressed,
  } = useProductPurchase();

  if (!selected || !purchasable) return null;
  if (buyBarSuppressed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite/10 bg-paper/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <p className="truncate font-editorial text-[16px] leading-tight text-graphite">
            {product.name}
          </p>
          <ProductPrice
            pricePaise={selected.pricePaise}
            compareAtPaise={selected.compareAtPricePaise}
            sizeMl={selected.sizeMl}
            size="sm"
            className="mt-0.5"
          />
        </div>

        {inCart ? (
          <ViewCartLink />
        ) : (
          <Button
            type="button"
            variant="ink"
            size="md"
            className="shrink-0 cursor-pointer"
            disabled={isPending || !cartReady}
            onClick={addSelectedToCart}
          >
            {isPending
              ? "Adding…"
              : ctaState === "added"
                ? "Added"
                : "Add to cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
