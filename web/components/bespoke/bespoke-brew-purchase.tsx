"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BESPOKE_ALLOWED_SIZES_ML,
  BESPOKE_MAX_LINE_QUANTITY,
  pricePaiseForSize,
} from "@ishraqparfums/shared";
import { CartGuestSavedModal } from "@/components/cart/cart-guest-saved-modal";
import { CartQuantityStepper } from "@/components/cart/cart-quantity-stepper";
import { ViewCartLink } from "@/components/cart/view-cart-link";
import { Button } from "@/components/ui/button";
import { useCartBespokeLine } from "@/lib/cart/use-cart-bespoke-line";
import {
  hasSeenGuestCartHint,
  markGuestCartHintSeen,
} from "@/lib/cart/guest-cart-hint";
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
  backHref?: string | null;
}) {
  const [sizeMl, setSizeMl] = useState<number>(
    BESPOKE_ALLOWED_SIZES_ML[1] ?? 50,
  );
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const cart = useCartBespokeLine(brewId, productName, {
    onGuestAdd: () => {
      if (!hasSeenGuestCartHint()) {
        markGuestCartHintSeen();
        setGuestModalOpen(true);
      }
    },
  });
  const qtyInSelected = cart.quantityForSize(sizeMl);
  const inCart = qtyInSelected > 0;

  return (
    <div className="mt-8 rounded-[4px] border border-graphite/10 bg-shell p-6">
      <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
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
                "relative cursor-pointer rounded-full border px-4 py-2 text-[14px] transition-colors duration-300",
                selected
                  ? "border-graphite bg-graphite text-shell"
                  : "border-graphite/20 text-graphite hover:border-terra/45",
              )}
            >
              {size} ml · {formatPaise(pricePaiseForSize(size))}
              {badge > 0 ? (
                <span
                  className={cn(
                    "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1",
                    "font-ui text-[10px] font-semibold leading-none",
                    selected
                      ? "bg-shell text-graphite"
                      : "bg-terra text-paper",
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
          <p className="text-[14px] text-graphite-faint">Checking cart…</p>
        ) : inCart ? (
          <>
            <CartQuantityStepper
              quantity={qtyInSelected}
              pending={cart.pending}
              min={0}
              max={BESPOKE_MAX_LINE_QUANTITY}
              size="md"
              aria-label={`Quantity in cart for ${productName} ${sizeMl} ml`}
              onChange={(next) => cart.setSizeQuantity(sizeMl, next)}
            />
            <ViewCartLink />
          </>
        ) : (
          <Button
            type="button"
            variant="ink"
            size="pill"
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
          className="mt-5 inline-block font-ui text-[13px] text-graphite-soft underline decoration-graphite/25 underline-offset-[3px] transition-colors hover:text-terra hover:decoration-terra/50"
        >
          Back to saved
        </Link>
      ) : null}
      <CartGuestSavedModal
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
      />
    </div>
  );
}
