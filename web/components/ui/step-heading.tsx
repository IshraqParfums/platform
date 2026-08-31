"use client";

import type { ReactNode } from "react";

/**
 * Paper/graphite section heading — an optional italic-serif numeral or
 * marker beside a title, with a description and trailing action. Named
 * apart from `ui/section-heading.tsx` (a v1 marketing-section heading with
 * an eyebrow + centered/light variants) since this is a different shape for
 * a different job: a step or record inside a flow, not a page section.
 * Promoted from `checkout/checkout-heading.tsx` once account needed the
 * same heading for its own sections.
 */
export function StepHeading({
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
