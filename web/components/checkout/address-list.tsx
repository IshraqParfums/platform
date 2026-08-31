"use client";

import { useRef, type KeyboardEvent } from "react";
import type { AddressResponse } from "@ishraqparfums/shared";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import {
  AddressChoiceAccent,
  AddressChoiceRadio,
  addressChoiceClassName,
} from "@/components/checkout/address-choice";
import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
import { cn } from "@/lib/cn";

export function AddressOption({
  address,
  selected,
  disabled,
  tabIndex,
  buttonRef,
  onSelect,
  onKeyDown,
}: {
  address: AddressResponse;
  selected: boolean;
  disabled?: boolean;
  tabIndex?: number;
  buttonRef?: (node: HTMLButtonElement | null) => void;
  onSelect: (id: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={() => onSelect(address.id)}
      onKeyDown={onKeyDown}
      className={cn(
        "h-full w-full cursor-pointer",
        addressChoiceClassName(selected),
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite/30",
        disabled && "opacity-55",
      )}
    >
      <AddressChoiceAccent selected={selected} />

      <div className="flex items-start gap-3">
        <AddressChoiceRadio selected={selected} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
            <span className="font-medium text-graphite">{address.name}</span>
            {address.isDefault ? (
              <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                Default
              </span>
            ) : null}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-graphite-soft">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} {address.pincode}
            <br />
            {formatIndianMobileDisplay(address.phone)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function AddressList({
  addresses,
  selectedId,
  disabled,
  onSelect,
}: {
  addresses: AddressResponse[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (addresses.length === 0) return null;

  const selectedIndex = addresses.findIndex(
    (address) => address.id === selectedId,
  );

  /** Arrow keys move the selection, as a radio group is expected to. */
  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLButtonElement>,
  ) {
    const delta =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;
    if (delta === 0) return;

    event.preventDefault();
    const next = (index + delta + addresses.length) % addresses.length;
    onSelect(addresses[next].id);
    optionRefs.current[next]?.focus();
  }

  return (
    <ul
      className={cn(
        checkoutLayoutV2.addressGrid,
        addresses.length > 1 && checkoutLayoutV2.addressGridMulti,
      )}
      role="radiogroup"
      aria-label="Saved addresses"
    >
      {addresses.map((address, index) => (
        <li key={address.id}>
          <AddressOption
            address={address}
            selected={address.id === selectedId}
            disabled={disabled}
            tabIndex={
              index === (selectedIndex === -1 ? 0 : selectedIndex) ? 0 : -1
            }
            buttonRef={(node) => {
              optionRefs.current[index] = node;
            }}
            onSelect={onSelect}
            onKeyDown={(event) => handleKeyDown(index, event)}
          />
        </li>
      ))}
    </ul>
  );
}
