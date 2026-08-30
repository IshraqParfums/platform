"use client";

import type { ReactNode } from "react";
import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
import { cn } from "@/lib/cn";

/** Surface shared by saved cards and the “new address” composer. */
export function addressChoiceClassName(selected: boolean): string {
  return cn(
    "relative overflow-hidden rounded-[4px] border text-left",
    checkoutLayoutV2.addressCard,
    "transition-[background-color,border-color,box-shadow] duration-200",
    checkoutLayoutV2.ease,
    selected
      ? "border-graphite/25 bg-shell shadow-[0_18px_44px_-30px_rgba(22,19,16,0.42)]"
      : "border-graphite/12 bg-transparent hover:border-graphite/25 hover:bg-shell/60",
  );
}

export function AddressChoiceAccent({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 w-[2px] origin-top bg-terra transition-transform duration-300",
        checkoutLayoutV2.ease,
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
        selected ? "border-graphite" : "border-graphite/30",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "size-2 rounded-full bg-graphite transition-transform duration-200",
          checkoutLayoutV2.ease,
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
              <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                {title}
              </p>
              {selected ? (
                <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite">
                  Selected
                </span>
              ) : null}
            </div>
            {selected ? (
              <p className="mt-1 text-sm text-graphite-soft">
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
