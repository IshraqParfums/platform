"use client";

import type { AddressResponse } from "@ishraqparfums/shared";
import { AddressComposerPanel } from "@/components/checkout/address-choice";
import { AddressForm } from "@/components/checkout/address-form";
import { AddressList } from "@/components/checkout/address-list";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import { Button } from "@/components/ui/button";
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
        <p className="mt-3 text-sm text-rose-deep" role="alert">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="cursor-pointer text-ink-soft"
                  onClick={onClearDraft}
                >
                  Clear
                </Button>
              ) : null}
              {hasSaved ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="cursor-pointer text-ink-soft"
                  onClick={onHideForm}
                >
                  Cancel
                </Button>
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

          {hasSaved ? (
            <p className="mt-3 text-sm text-ink-faint">
              Saved to your account when you pay.
            </p>
          ) : null}
        </AddressComposerPanel>
      ) : hasSaved ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onShowForm}
          className={cn(
            "mt-3 inline-flex cursor-pointer items-center gap-2 font-mono text-label-sm uppercase text-ink-faint",
            "transition-colors duration-200 hover:text-ink",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30",
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
