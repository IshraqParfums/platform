"use client";

import type { AddressResponse } from "@ishraqparfums/shared";
import { AddressComposerPanel } from "@/components/checkout/address-choice";
import { AddressForm } from "@/components/address/address-form";
import { AddressList } from "@/components/checkout/address-list";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import {
  isAddressDraftPristine,
  type AddressDraft,
  type AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";
import { cn } from "@/lib/cn";

/** Scroll target when payment is blocked on a missing delivery address. */
export const ADDRESS_SECTION_ID = "checkout-delivery";

/**
 * Delivery choices: saved cards or a new-address composer that uses the same
 * selected chrome, so the ship-to destination is always obvious.
 */
export function AddressSection({
  step,
  addresses,
  selectedId,
  showForm,
  draft,
  draftErrors,
  error,
  disabled,
  onSelect,
  onShowForm,
  onHideForm,
  onClearDraft,
  onDraftChange,
}: {
  step: string;
  addresses: AddressResponse[];
  selectedId: string | null;
  showForm: boolean;
  draft: AddressDraft;
  draftErrors?: AddressDraftErrors;
  error?: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onShowForm: () => void;
  onHideForm: () => void;
  onClearDraft: () => void;
  onDraftChange: (draft: AddressDraft) => void;
}) {
  const hasSaved = addresses.length > 0;
  const canClear = !isAddressDraftPristine(draft);
  /** Composer is the active destination whenever it is open. */
  const composing = showForm;

  return (
    <CheckoutSection
      id={ADDRESS_SECTION_ID}
      step={step}
      title="Delivery address"
      description={
        hasSaved
          ? "Choose where this order should arrive."
          : "Where should we send your fragrances?"
      }
    >
      {hasSaved ? (
        <AddressList
          addresses={addresses}
          selectedId={composing ? null : selectedId}
          disabled={disabled}
          onSelect={onSelect}
        />
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-terra" role="alert">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <AddressComposerPanel
          title={hasSaved ? "New address" : "Your address"}
          selected
          className={cn("mt-3", "p-5")}
          actions={
            <>
              {canClear ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onClearDraft}
                  className={cn(
                    "cursor-pointer font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint",
                    "transition-colors duration-200 hover:text-terra",
                    "disabled:cursor-not-allowed disabled:opacity-55",
                  )}
                >
                  Clear
                </button>
              ) : null}
              {hasSaved ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onHideForm}
                  className={cn(
                    "cursor-pointer font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint",
                    "transition-colors duration-200 hover:text-terra",
                    "disabled:cursor-not-allowed disabled:opacity-55",
                  )}
                >
                  Cancel
                </button>
              ) : null}
            </>
          }
        >
          <AddressForm
            draft={draft}
            errors={draftErrors}
            disabled={disabled}
            showDefaultToggle={hasSaved}
            onChange={onDraftChange}
          />
        </AddressComposerPanel>
      ) : hasSaved ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onShowForm}
          className={cn(
            "mt-3 inline-flex cursor-pointer items-center gap-2 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint",
            "transition-colors duration-200 hover:text-terra",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite/30",
            "disabled:cursor-not-allowed disabled:opacity-55",
          )}
        >
          <span aria-hidden className="text-sm leading-none">
            +
          </span>
          Add a new address
        </button>
      ) : null}
    </CheckoutSection>
  );
}
