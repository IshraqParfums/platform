"use client";

import type { ReactNode } from "react";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { cn } from "@/lib/cn";

/** Surface shared by saved cards and the “new address” composer. */
export function addressChoiceClassName(selected: boolean): string {
  return cn(
    "relative overflow-hidden rounded-lg border text-left",
    checkoutLayout.addressCard,
    "transition-[background-color,border-color] duration-200",
    checkoutLayout.ease,
    selected
      ? "border-ink/40 bg-card"
      : "border-ink/15 bg-transparent hover:border-ink/30 hover:bg-card/60",
  );
}

export function AddressChoiceAccent({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 w-[2px] origin-top bg-gold transition-transform duration-300",
        checkoutLayout.ease,
        selected ? "scale-y-100" : "scale-y-0",
      )}
    />
  );
}

export function AddressChoiceRadio({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
        selected ? "border-ink" : "border-ink/30",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "size-2 rounded-full bg-ink transition-transform duration-200",
          checkoutLayout.ease,
          selected ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}

/**
 * Selected “new address” choice: same chrome as a saved card so delivery
 * destination is never ambiguous while composing.
 */
export function AddressComposerPanel({
  title,
  selected,
  actions,
  children,
  className,
}: {
  title: string;
  selected: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={title}
      className={cn(addressChoiceClassName(selected), className)}
    >
      <AddressChoiceAccent selected={selected} />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <AddressChoiceRadio selected={selected} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-label-sm uppercase text-ink-faint">
                {title}
              </p>
              {selected ? (
                <span className="font-mono text-label-sm uppercase text-ink">
                  Selected
                </span>
              ) : null}
            </div>
            {selected ? (
              <p className="mt-1 text-sm text-ink-soft">
                This order will ship here
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        ) : null}
      </div>

      {children}
    </div>
  );
}
