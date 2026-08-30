"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Labeled form-field chrome — paper/graphite surface. Promoted from
 * `checkout/checkout-field.tsx` once account's v1 `AddressForm`/`FormField`
 * migrated too, so checkout and account (the only two places a field like
 * this appears) share one implementation instead of two forks.
 */
export function fieldControlClassName(invalid?: boolean): string {
  return cn(
    "w-full min-h-11 rounded-[3px] border bg-paper px-3.5 py-2.5 mt-1.5",
    "text-[15px] text-graphite outline-none transition-colors",
    "placeholder:text-graphite-faint",
    "focus-visible:border-graphite/45",
    "disabled:cursor-not-allowed disabled:opacity-55",
    invalid ? "border-terra/60" : "border-graphite/20",
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  optional,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className="block">
        <span className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
          {label}
          {optional ? (
            <span className="normal-case tracking-normal text-graphite-faint/80">
              {" "}
              (optional)
            </span>
          ) : null}
        </span>
        {children}
      </label>
      {error ? (
        <p className="mt-1 text-sm text-terra" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-sm text-graphite-faint">{hint}</p>
      ) : null}
    </div>
  );
}
