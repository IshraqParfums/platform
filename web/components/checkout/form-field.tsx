"use client";

import type { ReactNode } from "react";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { cn } from "@/lib/cn";

export function SectionHeading({
  id,
  step,
  title,
  description,
  action,
}: {
  id: string;
  /**
   * Position in the checkout, e.g. `"01"`. Rendered as a hanging mono numeral —
   * this is the progress indicator, living on the step it describes rather than
   * in a separate strip that has to be kept in sync with it. Decorative to
   * assistive tech, which already reads the steps in document order.
   */
  step?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-baseline gap-3 sm:gap-4">
        {step ? (
          <span
            aria-hidden
            className="shrink-0 font-mono text-label-sm uppercase tabular-nums text-ink-faint"
          >
            {step}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2
            id={id}
            className="font-display text-xl font-semibold tracking-[-0.015em] text-ink"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function fieldControlClassName(invalid?: boolean): string {
  return cn(
    "w-full min-h-11 rounded-none border bg-cream-soft px-3.5 py-2.5",
    checkoutLayout.labelToControl,
    "text-[15px] text-ink outline-none transition-colors",
    "placeholder:text-ink-faint",
    "focus-visible:border-ink/45",
    "disabled:cursor-not-allowed disabled:opacity-55",
    invalid ? "border-ink/35" : "border-ink/20",
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
        <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          {label}
          {optional ? (
            <span className="normal-case tracking-normal text-ink-faint/80">
              {" "}
              (optional)
            </span>
          ) : null}
        </span>
        {children}
      </label>
      {error ? (
        <p className="mt-1 text-sm text-ink-soft" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-sm text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
