"use client";

import type { ReactNode } from "react";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { cn } from "@/lib/cn";

export type FactField = {
  label: string;
  value: ReactNode;
  /** Classes for the value (`dd`), e.g. emphasis or soft tone. */
  valueClassName?: string;
};

/**
 * Compact label-over-value facts. Width follows content so adjacent columns
 * stay close — reusable anywhere checkout (or account) states settled details.
 */
export function FactRecord({
  fields,
  className,
}: {
  fields: readonly FactField[];
  className?: string;
}) {
  return (
    <dl className={cn(checkoutLayout.factRecord, className)}>
      {fields.map((field) => (
        <div key={field.label} className="min-w-0 max-w-xs">
          <dt className={checkoutLayout.factLabel}>{field.label}</dt>
          <dd className={cn(checkoutLayout.factValue, field.valueClassName)}>
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
