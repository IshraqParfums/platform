"use client";

import type { ReactNode } from "react";

/**
 * v2 checkout step heading — forked from `form-field.tsx`'s `SectionHeading`
 * so the account order-detail view, which still renders through the v1
 * version, keeps its current look.
 *
 * The step numeral is set in italic editorial serif rather than tracked
 * mono — a chapter mark, not a progress-bar digit. Delivery and payment
 * really are the only two steps here, so numbering them still earns its
 * keep; it just reads as the book this order is a short chapter of.
 */
export function CheckoutHeading({
  id,
  step,
  title,
  description,
  action,
}: {
  id: string;
  step?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-baseline gap-4 sm:gap-5">
        {step ? (
          <span
            aria-hidden
            className="shrink-0 font-editorial text-[17px] italic tabular-nums text-terra/70"
          >
            {step}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2
            id={id}
            className="font-editorial text-[22px] leading-none text-graphite"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-[15px] leading-relaxed text-graphite-soft">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
