"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { CheckoutTrustInfo } from "@/components/checkout/checkout-trust-info";
import { formatPaise } from "@/lib/format/money";
import { cn } from "@/lib/cn";

export type PaymentActionProps = {
  totalPaise: number;
  disabled?: boolean;
  preparing?: boolean;
  onPay: () => void;
  className?: string;
};

/**
 * The end of the journey: one CTA — the only one on the page, at every
 * breakpoint — with room around it and reassurance sitting quietly beneath
 * rather than beside it.
 */
export function PaymentSection({
  totalPaise,
  disabled,
  preparing,
  onPay,
  className,
}: PaymentActionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={cn(className)}>
      <h2 id={headingId} className="sr-only">
        Payment
      </h2>

      <Button
        type="button"
        variant="ink"
        size="pill"
        disabled={disabled || preparing}
        onClick={onPay}
        className="w-full cursor-pointer"
      >
        {preparing ? "Preparing checkout…" : `Pay ${formatPaise(totalPaise)}`}
      </Button>

      <CheckoutTrustInfo className="mt-5" />
    </section>
  );
}
