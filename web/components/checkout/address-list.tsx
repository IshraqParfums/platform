"use client";

import type { AddressResponse } from "@ishraqparfums/shared";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { cn } from "@/lib/cn";

export function AddressOption({
  address,
  selected,
  disabled,
  onSelect,
}: {
  address: AddressResponse;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onSelect(address.id)}
      className={cn(
        "w-full min-h-12 cursor-pointer border text-left transition-colors duration-200",
        checkoutLayout.addressCard,
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30",
        selected
          ? "border-ink/40 bg-cream-soft"
          : "border-ink/10 bg-transparent hover:border-ink/25",
        disabled && "opacity-55",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{address.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} {address.pincode}
            <br />
            {address.phone}
          </p>
        </div>
        <span
          className={cn(
            "mt-1 size-4 shrink-0 rounded-full border",
            selected ? "border-ink bg-ink" : "border-ink/30 bg-transparent",
          )}
          aria-hidden
        />
      </div>
      {address.isDefault ? (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Default
        </p>
      ) : null}
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
  if (addresses.length === 0) return null;

  return (
    <ul
      className={checkoutLayout.addressList}
      role="radiogroup"
      aria-label="Saved addresses"
    >
      {addresses.map((address) => (
        <li key={address.id}>
          <AddressOption
            address={address}
            selected={address.id === selectedId}
            disabled={disabled}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
