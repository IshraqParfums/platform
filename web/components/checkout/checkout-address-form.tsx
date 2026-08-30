"use client";

import { useRef } from "react";
import {
  indianMobileNationalDigits,
  normalizeIndianMobile,
} from "@ishraqparfums/shared";
import {
  CheckoutField,
  checkoutFieldControlClassName,
} from "@/components/checkout/checkout-field";
import { CheckoutInput } from "@/components/checkout/checkout-input";
import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
import { lookupPincode } from "@/lib/address/pincode-lookup";
import type {
  AddressDraft,
  AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";
import { cn } from "@/lib/cn";

/**
 * v2 checkout delivery-address fields — forked from
 * `components/address/address-form.tsx` (same shared validation/lookup
 * calls, only the chrome differs) so the account address editor, which
 * still renders through the original, keeps its v1 look.
 */
export function CheckoutAddressForm({
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
    <div className={checkoutLayoutV2.fieldStack}>
      <div className={cn("grid sm:grid-cols-2", checkoutLayoutV2.fieldGrid)}>
        <CheckoutField
          label="Recipient name"
          htmlFor="checkout-address-name"
          error={errors?.name}
        >
          <CheckoutInput
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
        </CheckoutField>

        <CheckoutField
          label="Recipient mobile"
          htmlFor="checkout-address-phone"
          error={errors?.phone}
        >
          <div
            className={cn(
              checkoutFieldControlClassName(Boolean(errors?.phone)),
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
        </CheckoutField>
      </div>

      <CheckoutField
        label="House / street"
        htmlFor="checkout-address-line1"
        error={errors?.line1}
      >
        <CheckoutInput
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
      </CheckoutField>

      <CheckoutField
        label="Landmark / apartment"
        htmlFor="checkout-address-line2"
        optional
      >
        <CheckoutInput
          id="checkout-address-line2"
          name="shipping-address-line2"
          autoComplete="shipping address-line2"
          disabled={disabled}
          value={draft.line2}
          placeholder="Apartment, landmark"
          onChange={(event) => patch({ line2: event.target.value })}
        />
      </CheckoutField>

      <div className={cn("grid sm:grid-cols-3", checkoutLayoutV2.fieldGrid)}>
        <CheckoutField
          label="PIN code"
          htmlFor="checkout-address-pincode"
          error={errors?.pincode}
        >
          <CheckoutInput
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
        </CheckoutField>

        <CheckoutField
          label="City"
          htmlFor="checkout-address-city"
          error={errors?.city}
        >
          <CheckoutInput
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
        </CheckoutField>

        <CheckoutField
          label="State"
          htmlFor="checkout-address-state"
          error={errors?.state}
        >
          <CheckoutInput
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
        </CheckoutField>
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
