"use client";

import { FormField } from "@/components/checkout/form-field";
import { FormInput } from "@/components/checkout/form-input";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import {
  normalizePhoneInput,
  type AddressDraft,
  type AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";
import { cn } from "@/lib/cn";

export function AddressForm({
  draft,
  errors,
  disabled,
  showDefaultToggle,
  onChange,
}: {
  draft: AddressDraft;
  errors?: AddressDraftErrors;
  disabled?: boolean;
  showDefaultToggle?: boolean;
  onChange: (next: AddressDraft) => void;
}) {
  function patch(partial: Partial<AddressDraft>) {
    onChange({ ...draft, ...partial });
  }

  return (
    <div className={checkoutLayout.fieldStack}>
      <div className={cn("grid sm:grid-cols-2", checkoutLayout.fieldGrid)}>
        <FormField
          label="Recipient name"
          htmlFor="checkout-address-name"
          error={errors?.name}
        >
          <FormInput
            id="checkout-address-name"
            name="shipping-name"
            autoComplete="shipping name"
            required
            disabled={disabled}
            value={draft.name}
            invalid={Boolean(errors?.name)}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </FormField>

        <FormField
          label="Phone"
          htmlFor="checkout-address-phone"
          error={errors?.phone}
          hint={!errors?.phone ? "Include country code" : undefined}
        >
          <FormInput
            id="checkout-address-phone"
            name="shipping-phone"
            type="tel"
            inputMode="tel"
            autoComplete="shipping tel"
            required
            disabled={disabled}
            value={draft.phone}
            invalid={Boolean(errors?.phone)}
            placeholder="+91 98765 43210"
            onChange={(event) =>
              patch({ phone: normalizePhoneInput(event.target.value) })
            }
          />
        </FormField>
      </div>

      <FormField
        label="Street address"
        htmlFor="checkout-address-line1"
        error={errors?.line1}
      >
        <FormInput
          id="checkout-address-line1"
          name="shipping-address-line1"
          autoComplete="shipping address-line1"
          required
          disabled={disabled}
          value={draft.line1}
          invalid={Boolean(errors?.line1)}
          onChange={(event) => patch({ line1: event.target.value })}
        />
      </FormField>

      <FormField
        label="Apartment / Suite"
        htmlFor="checkout-address-line2"
        optional
      >
        <FormInput
          id="checkout-address-line2"
          name="shipping-address-line2"
          autoComplete="shipping address-line2"
          disabled={disabled}
          value={draft.line2}
          onChange={(event) => patch({ line2: event.target.value })}
        />
      </FormField>

      <div className={cn("grid sm:grid-cols-3", checkoutLayout.fieldGrid)}>
        <FormField
          label="PIN code"
          htmlFor="checkout-address-pincode"
          error={errors?.pincode}
        >
          <FormInput
            id="checkout-address-pincode"
            name="shipping-postal-code"
            inputMode="numeric"
            autoComplete="shipping postal-code"
            required
            maxLength={6}
            disabled={disabled}
            value={draft.pincode}
            invalid={Boolean(errors?.pincode)}
            onChange={(event) =>
              patch({
                pincode: event.target.value.replace(/\D/g, "").slice(0, 6),
              })
            }
          />
        </FormField>

        <FormField
          label="City"
          htmlFor="checkout-address-city"
          error={errors?.city}
        >
          <FormInput
            id="checkout-address-city"
            name="shipping-city"
            autoComplete="shipping address-level2"
            required
            disabled={disabled}
            value={draft.city}
            invalid={Boolean(errors?.city)}
            onChange={(event) => patch({ city: event.target.value })}
          />
        </FormField>

        <FormField
          label="State"
          htmlFor="checkout-address-state"
          error={errors?.state}
        >
          <FormInput
            id="checkout-address-state"
            name="shipping-state"
            autoComplete="shipping address-level1"
            required
            disabled={disabled}
            value={draft.state}
            invalid={Boolean(errors?.state)}
            onChange={(event) => patch({ state: event.target.value })}
          />
        </FormField>
      </div>

      {showDefaultToggle ? (
        <label
          className={cn(
            "flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ink-soft",
            disabled && "cursor-not-allowed opacity-55",
          )}
        >
          <input
            type="checkbox"
            checked={draft.isDefault}
            disabled={disabled}
            onChange={(event) => patch({ isDefault: event.target.checked })}
            className="size-4 accent-gold"
          />
          Set as default address
        </label>
      ) : null}
    </div>
  );
}
