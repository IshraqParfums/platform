"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type {
  ProductAvailability,
  ProductDetailVariant,
} from "@ishraqparfums/shared";
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

function purchaseErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  if (/isn['']t available to buy/i.test(raw) || /not available for purchase/i.test(raw)) {
    return "This fragrance isn't available to buy right now.";
  }
  if (/out of stock/i.test(raw)) {
    return "That size just sold out. Try another size or check back soon.";
  }
  if (/isn['']t available right now|currently unavailable/i.test(raw)) {
    return "That size isn't available right now.";
  }
  return raw || "Could not add to cart";
}

/**
 * Size selection, live price, stock line, add-to-cart / in-cart qty, trust strip.
 * Sizes stay visible for OUT_OF_STOCK and UNAVAILABLE; CTA only when buyable.
 *
 * Ported from product/product-purchase-panel.tsx: every hook and handler
 * below (cart line state, add-to-cart transition, guest-cart modal wiring,
 * variant selection, stock logic) is unchanged — only the JSX classes and the
 * new `claims` passthrough to `ProductTrustStrip` are v2. The v1 CTA icons
 * (lucide `Check`/`ShoppingBag`) are dropped per this site's no-icon rule;
 * the button's state text alone still carries idle/adding/added/error.
 */
export function ProductPurchasePanel({
  variants,
  product,
  availability,
  claims,
}: {
  variants: ProductDetailVariant[];
  product: PurchaseProductMeta;
  availability: ProductAvailability;
  claims?: string[] | null;
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
    applySummary,
  } = useCartVariantLine(selected?.id ?? null);

  const sizeSellable = selected ? isVariantSellable(selected) : false;
  const purchasable = availability === "AVAILABLE" && sizeSellable;
  const stock = stockLabel(selected);
  const inCart = cartReady && cartQty > 0;
  const maxQty =
    selected && selected.stockQty > 0 ? selected.stockQty : undefined;

  const closeGuestModal = useCallback(() => {
    setGuestModalOpen(false);
  }, []);

  function onAdd() {
    if (!selected || !purchasable) return;
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

        applySummary(result.summary, {
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
        toastAddedToCart(product.name);
        setCtaState("added");
        window.setTimeout(() => setCtaState("idle"), 2200);
      } catch (error) {
        setCtaState("error");
        const message = purchaseErrorMessage(error);
        setErrorMessage(message);
        toast.error("Could not add to cart", message);
      }
    });
  }

  if (!selected) {
    return (
      <p className="text-sm text-graphite-faint">
        This product has no sizes yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
          Size
        </p>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Bottle size"
        >
          {ordered.map((variant) => {
            const sellable = isVariantSellable(variant);
            const active = variant.id === selected.id;
            return (
              <FilterChip
                key={variant.id}
                active={active}
                role="radio"
                aria-checked={active}
                aria-disabled={!sellable}
                className={cn(
                  !sellable &&
                    "opacity-45 line-through hover:border-ink/20 hover:text-ink-soft",
                )}
                onClick={() => {
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
              purchasable ? "text-rose-deep" : "text-graphite-faint",
            )}
          >
            {stock}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
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
            className="w-full cursor-pointer sm:w-auto sm:min-w-[14rem]"
            disabled={isPending || !cartReady}
            onClick={onAdd}
          >
            {isPending
              ? "Adding…"
              : ctaState === "added"
                ? "Added"
                : "Add to cart"}
          </Button>
        ) : availability === "UNAVAILABLE" ? (
          <p className="text-sm text-graphite-faint">
            This fragrance isn&apos;t for sale right now.
          </p>
        ) : (
          <p className="text-sm text-graphite-faint">
            This size is currently unavailable.
          </p>
        )}
        {purchasable ? <ProductTrustStrip claims={claims} /> : null}
        {ctaState === "error" && errorMessage ? (
          <p className="text-sm text-rose-deep">{errorMessage}</p>
        ) : null}
      </div>

      <CartGuestSavedModal open={guestModalOpen} onClose={closeGuestModal} />
    </div>
  );
}
