"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BESPOKE_ALLOWED_SIZES_ML,
  BESPOKE_PAISE_PER_ML,
} from "@ishraqparfums/shared";
import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import { ViewCartLink } from "@/components/cart/view-cart-link";
import { Button } from "@/components/ui/button";
import { useCartBespokeLine } from "@/lib/cart/use-cart-bespoke-line";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

/**
 * Size picker + add / stepper for an owned bespoke brew.
 * Per-size badge shows how many of that ml are already in the cart.
 */
export function BespokeBrewPurchase({
  brewId,
  productName,
  backHref = "/bespoke/saved",
}: {
  brewId: string;
  productName: string;
  backHref?: string;
}) {
  const cart = useCartBespokeLine(brewId, productName);
  const [sizeMl, setSizeMl] = useState<number>(
    BESPOKE_ALLOWED_SIZES_ML[1] ?? 50,
  );
  const qtyInSelected = cart.quantityForSize(sizeMl);
  const inCart = qtyInSelected > 0;

  return (
    <div className="mt-8 rounded-lg border border-ink/12 bg-card p-5">
      <p className="font-mono text-label-sm uppercase text-ink-faint">
        Bottle size
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {BESPOKE_ALLOWED_SIZES_ML.map((size) => {
          const badge = cart.sizeQuantities[size] ?? 0;
          const selected = sizeMl === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setSizeMl(size)}
              className={cn(
                "relative cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                selected
                  ? "border-gold bg-gold text-deep"
                  : "border-ink/20 text-ink hover:border-gold/50",
              )}
            >
              {size} ml · {formatPaise(size * BESPOKE_PAISE_PER_ML)}
              {badge > 0 ? (
                <span
                  className={cn(
                    "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1",
                    "font-mono text-[10px] font-semibold leading-none",
                    selected
                      ? "bg-deep text-cream-soft"
                      : "bg-gold text-deep",
                  )}
                  aria-label={`${badge} in cart`}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!cart.ready ? (
          <p className="text-sm text-ink-faint">Checking cart…</p>
        ) : inCart ? (
          <>
            <CartQuantityStepper
              quantity={qtyInSelected}
              pending={cart.pending}
              min={0}
              size="md"
              aria-label={`Quantity in cart for ${productName} ${sizeMl} ml`}
              onChange={(next) => cart.setSizeQuantity(sizeMl, next)}
            />
            <ViewCartLink />
          </>
        ) : (
          <Button
            type="button"
            variant="emphasis"
            size="lg"
            className="cursor-pointer"
            disabled={cart.pending}
            onClick={() => cart.addSize(sizeMl, 1)}
          >
            {cart.pending ? "Adding…" : "Add to cart"}
          </Button>
        )}
      </div>

      {backHref ? (
        <Link
          href={backHref}
          className="mt-5 inline-block text-sm text-ink-soft underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink/50"
        >
          Back to saved
        </Link>
      ) : null}
    </div>
  );
}
