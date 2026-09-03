"use client";

import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import { useProductPurchase } from "@/components/product-v2/purchase-context";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/format/money";

/**
 * Phone-only buy strip. It exists for one job: you have scrolled into the
 * story and should not have to climb back to the arrival to buy.
 *
 * Price + add, or price + quantity once that size is already in the cart.
 * No name, no strike-through, no "View cart" — the header bag covers that.
 * Hidden on first view (even when Add to cart is below the fold), while
 * the arrival CTA is on screen, and again past the end sentinel.
 */
export function ProductMobileBuyBar() {
  const {
    selected,
    purchasable,
    inCart,
    cartQty,
    setCartQty,
    cartPending,
    maxQty,
    isPending,
    cartReady,
    addSelectedToCart,
    product,
    buyBarSuppressed,
  } = useProductPurchase();

  if (!selected || !purchasable) return null;
  if (buyBarSuppressed) return null;

  return (
    <div
      role="region"
      aria-label={`Buy ${product.name}`}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite/10 bg-paper lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-2.5">
        <p className="min-w-0 font-editorial text-[18px] leading-none text-graphite">
          {formatPaise(selected.pricePaise)}
          {selected.sizeMl != null ? (
            <span className="ml-2 text-[13px] text-graphite-soft">
              {selected.sizeMl} ml
            </span>
          ) : null}
        </p>
        {inCart ? (
          <CartQuantityStepper
            quantity={cartQty}
            pending={cartPending}
            min={0}
            max={maxQty}
            size="sm"
            aria-label={`Quantity in cart for ${product.name}`}
            onChange={setCartQty}
          />
        ) : (
          <Button
            type="button"
            variant="ink"
            size="sm"
            className="shrink-0 cursor-pointer"
            disabled={isPending || !cartReady}
            onClick={addSelectedToCart}
          >
            {isPending ? "Adding…" : "Add to cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
