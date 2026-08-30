"use client";

import { useRef } from "react";
import {
  indianMobileNationalDigits,
  normalizeIndianMobile,
} from "@ishraqparfums/shared";
import { FormField, fieldControlClassName } from "@/components/ui/field";
import { FormInput } from "@/components/ui/form-input";
import { lookupPincode } from "@/lib/address/pincode-lookup";
import type {
  AddressDraft,
  AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";
import { cn } from "@/lib/cn";

/**
 * Delivery-address fields, paper/graphite surface — shared by checkout's
 * address composer and account's address editor, the only two places this
 * form appears.
 */
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
  /** PIN that last drove autofill — city/state stay overwriteable until user edits after. */
  const autofilledFromPin = useRef<string | null>(null);
  const lookupSeq = useRef(0);

  function patch(partial: Partial<AddressDraft>) {
    onChange({ ...draft, ...partial });
  }

  function setNationalMobile(national: string) {
    const digits = national.replace(/\D/g, "").slice(0, 10);
    patch({ phone: normalizeIndianMobile(digits.length > 0 ? digits : "") });
  }

  async function onPincodeChange(raw: string) {
    const pincode = raw.replace(/\D/g, "").slice(0, 6);
    const cityAtStart = draft.city;
    const stateAtStart = draft.state;
    const overwriteAutofill = autofilledFromPin.current !== null;
    const next: AddressDraft = { ...draft, pincode };
    onChange(next);

    if (pincode.length !== 6) {
      return;
    }

    const seq = ++lookupSeq.current;
    const result = await lookupPincode(pincode);
    if (seq !== lookupSeq.current || !result) return;

    autofilledFromPin.current = pincode;
    onChange({
      ...next,
      city:
        !cityAtStart.trim() || overwriteAutofill ? result.city : next.city,
      state:
        !stateAtStart.trim() || overwriteAutofill ? result.state : next.state,
    });
  }

  const nationalPhone = indianMobileNationalDigits(draft.phone);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
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
            placeholder="Full name"
            onChange={(event) => patch({ name: event.target.value })}
          />
        </FormField>

        <FormField
          label="Recipient mobile"
          htmlFor="checkout-address-phone"
          error={errors?.phone}
        >
          <div
            className={cn(
              fieldControlClassName(Boolean(errors?.phone)),
              "flex items-center gap-2",
            )}
          >
            <span
              className="shrink-0 tabular-nums text-graphite-soft"
              aria-hidden
            >
              +91
            </span>
            <input
              id="checkout-address-phone"
              name="shipping-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="shipping tel-national"
              required
              disabled={disabled}
              value={nationalPhone}
              placeholder="98765 43210"
              maxLength={10}
              aria-invalid={Boolean(errors?.phone) || undefined}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-graphite outline-none placeholder:text-graphite-faint disabled:cursor-not-allowed"
              onChange={(event) => setNationalMobile(event.target.value)}
            />
          </div>
        </FormField>
      </div>

      <FormField
        label="House / street"
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
          placeholder="House no., street"
          onChange={(event) => patch({ line1: event.target.value })}
        />
      </FormField>

      <FormField
        label="Landmark / apartment"
        htmlFor="checkout-address-line2"
        optional
      >
        <FormInput
          id="checkout-address-line2"
          name="shipping-address-line2"
          autoComplete="shipping address-line2"
          disabled={disabled}
          value={draft.line2}
          placeholder="Apartment, landmark"
          onChange={(event) => patch({ line2: event.target.value })}
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-3">
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
            placeholder="560001"
            onChange={(event) => {
              void onPincodeChange(event.target.value);
            }}
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
            placeholder="City"
            onChange={(event) => {
              autofilledFromPin.current = null;
              patch({ city: event.target.value });
            }}
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
            placeholder="State"
            onChange={(event) => {
              autofilledFromPin.current = null;
              patch({ state: event.target.value });
            }}
          />
        </FormField>
      </div>

      {showDefaultToggle ? (
        <label
          className={cn(
            "flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-graphite-soft",
            disabled && "cursor-not-allowed opacity-55",
          )}
        >
          <input
            type="checkbox"
            checked={draft.isDefault}
            disabled={disabled}
            onChange={(event) => patch({ isDefault: event.target.checked })}
            className="size-4 accent-terra"
          />
          Save as default
        </label>
      ) : null}
    </div>
  );
}
