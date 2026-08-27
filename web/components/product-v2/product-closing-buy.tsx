"use client";

import { ProductPrice } from "@/components/product-v2/product-price";
import { ProductSizeSelect } from "@/components/product-v2/product-size-select";
import { useProductPurchase } from "@/components/product-v2/purchase-context";
import { ViewCartLink } from "@/components/cart/view-cart-link";
import { Button } from "@/components/ui/button";

/**
 * Closing offer: name and sizes on the left, price + action as one cluster
 * on the right — so the money and the button read as a single decision.
 */
export function ProductClosingBuy() {
  const {
    ordered,
    selected,
    selectVariant,
    purchasable,
    inCart,
    isPending,
    cartReady,
    ctaState,
    addSelectedToCart,
    product,
  } = useProductPurchase();

  if (!selected) return null;

  return (
    <div className="hidden border-t border-graphite/10 pt-8 lg:flex lg:items-end lg:justify-between lg:gap-10">
      <div className="min-w-0 space-y-4">
        <p className="font-editorial text-h4-editorial text-graphite">
          {product.name}
        </p>
        <ProductSizeSelect
          variants={ordered}
          selectedId={selected.id}
          onSelect={selectVariant}
          heading={false}
        />
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <ProductPrice
          pricePaise={selected.pricePaise}
          compareAtPaise={selected.compareAtPricePaise}
          size="sm"
        />

        {purchasable && inCart ? (
          <ViewCartLink />
        ) : purchasable ? (
          <Button
            type="button"
            variant="ink"
            size="lg"
            className="cursor-pointer"
            disabled={isPending || !cartReady}
            onClick={addSelectedToCart}
          >
            {isPending
              ? "Adding…"
              : ctaState === "added"
                ? "Added"
                : "Add to cart"}
          </Button>
        ) : (
          <p className="max-w-[22ch] text-[15px] leading-snug text-graphite-soft">
            This size is currently unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
