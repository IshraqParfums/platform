"use client";

import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import { ViewCartLink } from "@/components/cart/view-cart-link";
import { ProductPrice } from "@/components/product-v2/product-price";
import { ProductSizeSelect } from "@/components/product-v2/product-size-select";
import { ProductTrustLine } from "@/components/product-v2/product-trust-line";
import { useProductPurchase } from "@/components/product-v2/purchase-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * The buy group inside the arrival — size, price, stock, CTA, trust line.
 *
 * Purely presentational now: every piece of state and the whole add-to-cart
 * path live in `purchase-context.tsx`, shared with the sticky mobile bar and
 * the closing row. Sizes stay visible for OUT_OF_STOCK and UNAVAILABLE; the
 * CTA only appears when the selected size is actually buyable.
 */
export function ProductPurchasePanel() {
  const {
    ordered,
    selected,
    selectVariant,
    availability,
    purchasable,
    stock,
    inCart,
    cartQty,
    setCartQty,
    cartPending,
    cartReady,
    maxQty,
    isPending,
    ctaState,
    errorMessage,
    addSelectedToCart,
    product,
    setBuyAnchor,
  } = useProductPurchase();

  if (!selected) {
    return (
      <p className="text-[16px] text-graphite-soft">
        This product has no sizes yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ProductSizeSelect
        variants={ordered}
        selectedId={selected.id}
        onSelect={selectVariant}
      />

      <div>
        <ProductPrice
          pricePaise={selected.pricePaise}
          compareAtPaise={selected.compareAtPricePaise}
          sizeMl={selected.sizeMl}
        />
        {stock ? (
          <p
            className={cn(
              "mt-2 text-[15px]",
              purchasable ? "text-terra" : "text-graphite-soft",
            )}
          >
            {stock}
          </p>
        ) : null}
      </div>

      {/* The sticky bar watches this block — it appears once this scrolls away. */}
      <div ref={setBuyAnchor} className="space-y-4">
        {purchasable && inCart ? (
          <div className="flex flex-wrap items-center gap-3">
            <CartQuantityStepper
              quantity={cartQty}
              pending={cartPending}
              min={0}
              max={maxQty}
              size="md"
              aria-label={`Quantity in cart for ${product.name}`}
              onChange={setCartQty}
            />
            <ViewCartLink />
          </div>
        ) : purchasable ? (
          <Button
            type="button"
            variant="ink"
            size="lg"
            className="w-full cursor-pointer sm:w-auto sm:min-w-[15rem]"
            disabled={isPending || !cartReady}
            onClick={addSelectedToCart}
          >
            {isPending
              ? "Adding…"
              : ctaState === "added"
                ? "Added"
                : "Add to cart"}
          </Button>
        ) : availability === "UNAVAILABLE" ? (
          <p className="text-[16px] text-graphite-soft">
            This fragrance isn&apos;t for sale right now.
          </p>
        ) : (
          <p className="text-[16px] text-graphite-soft">
            This size is currently unavailable.
          </p>
        )}

        {purchasable ? <ProductTrustLine /> : null}

        {ctaState === "error" && errorMessage ? (
          <p className="text-[15px] text-rose-deep">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
