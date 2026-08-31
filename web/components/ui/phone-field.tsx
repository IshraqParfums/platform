"use client";

import {
  indianMobileNationalDigits,
  normalizeIndianMobile,
} from "@ishraqparfums/shared";
import { fieldControlClassName } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/**
 * Indian mobile input: a static "+91" chip beside a 10-digit national field,
 * normalizing to E.164 on every change. Promoted out of `AddressForm` (its
 * original, only call site) once `LoginForm` needed the exact same pattern —
 * shared here rather than reinventing a second freeform phone input.
 */
export function PhoneField({
  id,
  name,
  value,
  onChange,
  disabled,
  invalid,
  required,
  autoComplete,
  autoFocus,
  placeholder = "98765 43210",
}: {
  id: string;
  name?: string;
  /** Full phone value, e.g. `"+91"` or `"+919876543210"`. */
  value: string;
  /** Receives the next value already normalized to E.164. */
  onChange: (nextE164: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const nationalDigits = indianMobileNationalDigits(value);

  function onDigitsChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    onChange(normalizeIndianMobile(digits.length > 0 ? digits : ""));
  }

  return (
    <div
      className={cn(
        fieldControlClassName(invalid),
        // The div itself is never focused — only the input inside is — so
        // `fieldControlClassName`'s `focus-visible:border-graphite/45` never
        // fires here. `focus-within:` is the correct variant for a
        // container reacting to a focused descendant.
        "flex items-center gap-2 focus-within:border-graphite/45",
      )}
    >
      <span className="shrink-0 tabular-nums text-graphite-soft" aria-hidden>
        +91
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
        disabled={disabled}
        value={nationalDigits}
        placeholder={placeholder}
        maxLength={10}
        aria-invalid={invalid || undefined}
        className="focus-ring-quiet min-w-0 flex-1 bg-transparent text-[15px] text-graphite outline-none placeholder:text-graphite-faint disabled:cursor-not-allowed"
        onChange={(event) => onDigitsChange(event.target.value)}
      />
    </div>
  );
}
