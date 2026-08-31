import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FactField = {
  label: string;
  value: ReactNode;
  /** Classes for the value (`dd`), e.g. emphasis or soft tone. */
  valueClassName?: string;
};

/**
 * Compact label-over-value facts, paper/graphite surface. Width follows
 * content so adjacent columns stay close. Shared by the account profile
 * card and an order's contact/shipping facts — previously one `FactRecord`
 * (checkout-only, never actually used by checkout's own v2 rebuild) and one
 * hand-rolled `Fact` component in `order-detail.tsx`; consolidated here
 * once both call sites moved to v2.
 */
export function FactRecord({
  fields,
  className,
}: {
  fields: readonly FactField[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid w-fit max-w-full grid-cols-1 gap-4 text-[15px] leading-relaxed sm:auto-cols-max sm:grid-flow-col sm:gap-x-10 sm:gap-y-0",
        className,
      )}
    >
      {fields.map((field) => (
        <div key={field.label} className="min-w-0 max-w-xs">
          <dt className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
            {field.label}
          </dt>
          <dd className={cn("mt-1.5", field.valueClassName)}>
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
