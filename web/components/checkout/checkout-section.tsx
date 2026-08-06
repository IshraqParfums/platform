"use client";

import { useId, type ReactNode } from "react";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { SectionHeading } from "@/components/checkout/form-field";
import { cn } from "@/lib/cn";

/**
 * One step of checkout: numbered heading, optional action, content.
 *
 * Every step is this shape, so adding or reordering one is a change to the
 * page's list of steps rather than to any step's markup — the numbering is
 * passed in by the page, never hardcoded by the section.
 */
export function CheckoutSection({
  id,
  step,
  title,
  description,
  action,
  children,
  className,
}: {
  /** DOM id, for scrolling a blocked customer back to the step that needs them. */
  id?: string;
  step: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = useId();

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(checkoutLayout.section, "scroll-mt-24", className)}
    >
      <SectionHeading
        id={headingId}
        step={step}
        title={title}
        description={description}
        action={action}
      />
      <div className={checkoutLayout.sectionToContent}>{children}</div>
    </section>
  );
}
