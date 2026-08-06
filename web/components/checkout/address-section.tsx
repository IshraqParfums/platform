"use client";

import type { AddressResponse } from "@ishraqparfums/shared";
import { AddressForm } from "@/components/checkout/address-form";
import { AddressList } from "@/components/checkout/address-list";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { SectionHeading } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import type {
  AddressDraft,
  AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";
import { cn } from "@/lib/cn";

/**
 * Delivery block: optional new-address form, then saved addresses always visible.
 */
export function AddressSection({
  addresses,
  selectedId,
  showForm,
  draft,
  draftErrors,
  disabled,
  onSelect,
  onShowForm,
  onHideForm,
  onDraftChange,
}: {
  addresses: AddressResponse[];
  selectedId: string | null;
  showForm: boolean;
  draft: AddressDraft;
  draftErrors?: AddressDraftErrors;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onShowForm: () => void;
  onHideForm: () => void;
  onDraftChange: (draft: AddressDraft) => void;
}) {
  const hasSaved = addresses.length > 0;

  return (
    <section aria-labelledby="checkout-address-heading">
      <SectionHeading
        id="checkout-address-heading"
        title="Delivery address"
        description="Where should we send your fragrances?"
        action={
          hasSaved && !showForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="cursor-pointer"
              onClick={onShowForm}
            >
              Add address
            </Button>
          ) : hasSaved && showForm ? (
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
          ) : null
        }
      />

      {showForm ? (
        <div
          className={cn(
            checkoutLayout.sectionToFields,
            hasSaved && "border border-ink/10 bg-cream-soft/60 p-4",
          )}
        >
          {hasSaved ? (
            <p className="mb-3 text-sm text-ink-soft">
              New address will be saved when you pay.
            </p>
          ) : null}
          <AddressForm
            draft={draft}
            errors={draftErrors}
            disabled={disabled}
            showDefaultToggle={hasSaved}
            onChange={onDraftChange}
          />
        </div>
      ) : null}

      {hasSaved ? (
        <AddressList
          addresses={addresses}
          selectedId={selectedId}
          disabled={disabled}
          onSelect={onSelect}
        />
      ) : null}
    </section>
  );
}
