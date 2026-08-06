"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { ProductDetailVariant } from "@ishraqparfums/shared";
import { CartGuestSavedModal } from "@/components/cart/cart-guest-saved-modal";
import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import { ViewCartLink } from "@/components/cart/view-cart-link";
import { ProductTrustStrip } from "@/components/product/product-trust-strip";
import { FilterChip } from "@/components/shop/filter-chip";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { toast } from "@/components/ui/toaster";
import { addToCart } from "@/lib/cart/add-to-cart";
import { toastAddedToCart } from "@/lib/cart/cart-toast";
import {
  hasSeenGuestCartHint,
  markGuestCartHintSeen,
} from "@/lib/cart/guest-cart-hint";
import { useCartVariantLine } from "@/lib/cart/use-cart-variant-line";
import { stockLabel } from "@/lib/catalog/product-stock";
import {
  isVariantSellable,
  pickDefaultVariant,
  sortVariantsBySize,
} from "@/lib/catalog/product-variants";
import { cn } from "@/lib/cn";

type CtaState = "idle" | "added" | "error";

export type PurchaseProductMeta = {
  name: string;
  slug: string;
  collectionName: string | null;
  shortDescription: string | null;
  primaryImageUrl: string | null;
};

/**
 * Size selection, live price, stock line, add-to-cart / in-cart qty, trust strip.
 * When the selected variant is already in the cart, shows − count + instead of Add.
 */
export function ProductPurchasePanel({
  variants,
  product,
}: {
  variants: ProductDetailVariant[];
  product: PurchaseProductMeta;
}) {
  const ordered = useMemo(() => sortVariantsBySize(variants), [variants]);
  const [selectedId, setSelectedId] = useState(
    () => pickDefaultVariant(variants)?.id ?? "",
  );
  const [ctaState, setCtaState] = useState<CtaState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected =
    ordered.find((variant) => variant.id === selectedId) ??
    pickDefaultVariant(ordered);

  const {
    ready: cartReady,
    pending: cartPending,
    quantity: cartQty,
    setQuantity: setCartQty,
  } = useCartVariantLine(selected?.id ?? null);

  const sellable = selected ? isVariantSellable(selected) : false;
  const stock = stockLabel(selected);
  const inCart = cartReady && cartQty > 0;
  const maxQty =
    selected && selected.stockQty > 0 ? selected.stockQty : undefined;

  const closeGuestModal = useCallback(() => {
    setGuestModalOpen(false);
  }, []);

  function onAdd() {
    if (!selected || !sellable) return;
    setErrorMessage(null);
    setCtaState("idle");

    startTransition(async () => {
      try {
        const result = await addToCart({
          variantId: selected.id,
          productName: product.name,
          productSlug: product.slug,
          collectionName: product.collectionName,
          shortDescription: product.shortDescription,
          sizeMl: selected.sizeMl,
          pricePaise: selected.pricePaise,
          compareAtPricePaise: selected.compareAtPricePaise,
          primaryImageUrl: product.primaryImageUrl,
          stockQty: selected.stockQty,
        });

        if (result.mode === "guest") {
          if (!hasSeenGuestCartHint()) {
            markGuestCartHintSeen();
            setGuestModalOpen(true);
            return;
          }
          toastAddedToCart(product.name);
          return;
        }

        toastAddedToCart(product.name);
        setCtaState("added");
        window.setTimeout(() => setCtaState("idle"), 2200);
      } catch (error) {
        setCtaState("error");
        const message =
          error instanceof Error ? error.message : "Could not add to cart";
        setErrorMessage(message);
        toast.error("Could not add to cart", message);
      }
    });
  }

  if (!selected) {
    return (
      <p className="text-sm text-ink-faint">This product has no sizes yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Size
        </p>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Bottle size"
        >
          {ordered.map((variant) => {
            const available = isVariantSellable(variant);
            const active = variant.id === selected.id;
            return (
              <FilterChip
                key={variant.id}
                active={active}
                disabled={!available}
                role="radio"
                aria-checked={active}
                className={cn(
                  !available &&
                    "cursor-not-allowed opacity-45 line-through hover:border-ink/20 hover:text-ink-soft",
                )}
                onClick={() => {
                  if (!available) return;
                  setSelectedId(variant.id);
                  setCtaState("idle");
                  setErrorMessage(null);
                }}
              >
                {variant.sizeMl} ml
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div>
        <Price
          pricePaise={selected.pricePaise}
          compareAtPaise={selected.compareAtPricePaise}
          sizeMl={selected.sizeMl}
          layout="stacked"
        />
        {stock ? (
          <p
            className={cn(
              "mt-2 text-sm",
              sellable ? "text-rose-deep" : "text-ink-faint",
            )}
          >
            {stock}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {sellable && inCart ? (
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
        ) : sellable ? (
          <Button
            type="button"
            variant="emphasis"
            size="lg"
            className="w-full cursor-pointer sm:w-auto sm:min-w-[14rem]"
            disabled={isPending || !cartReady}
            onClick={onAdd}
          >
            {ctaState === "added" ? (
              <Check className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            ) : (
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            )}
            {isPending
              ? "Adding…"
              : ctaState === "added"
                ? "Added"
                : "Add to cart"}
          </Button>
        ) : (
          <p className="text-sm text-ink-faint">
            This size is currently unavailable.
          </p>
        )}
        {sellable ? <ProductTrustStrip /> : null}
        {ctaState === "error" && errorMessage ? (
          <p className="text-sm text-rose-deep">{errorMessage}</p>
        ) : null}
      </div>

      <CartGuestSavedModal open={guestModalOpen} onClose={closeGuestModal} />
    </div>
  );
}
