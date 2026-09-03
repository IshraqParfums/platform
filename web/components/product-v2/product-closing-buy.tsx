"use client";

import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import { ProductPrice } from "@/components/product-v2/product-price";
import { ProductSizeSelect } from "@/components/product-v2/product-size-select";
import { useProductPurchase } from "@/components/product-v2/purchase-context";
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
    cartQty,
    setCartQty,
    cartPending,
    isPending,
    cartReady,
    variantQuantities,
    maxQty,
    ctaState,
    addSelectedToCart,
    product,
  } = useProductPurchase();

  if (!selected) return null;

  return (
    <div className="flex items-end justify-between gap-10 border-t border-graphite/10 pt-8">
      <div className="min-w-0 space-y-4">
        <p className="font-editorial text-h4-editorial text-graphite">
          {product.name}
        </p>
        <ProductSizeSelect
          variants={ordered}
          selectedId={selected.id}
          onSelect={selectVariant}
          heading={false}
          quantities={variantQuantities}
        />
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <ProductPrice
          pricePaise={selected.pricePaise}
          size="sm"
        />

        {purchasable && inCart ? (
          <CartQuantityStepper
            quantity={cartQty}
            pending={cartPending}
            min={0}
            max={maxQty}
            size="md"
            aria-label={`Quantity in cart for ${product.name}`}
            onChange={setCartQty}
          />
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
