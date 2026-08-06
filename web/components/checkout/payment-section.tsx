"use client";

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
 * Primary pay CTA + trust lines. Embed in summary (desktop sticky) or standalone.
 */
export function PaymentSection({
  totalPaise,
  disabled,
  preparing,
  onPay,
  className,
}: PaymentActionProps) {
  return (
    <section
      aria-labelledby="checkout-pay-heading"
      className={cn(className)}
    >
      <h2 id="checkout-pay-heading" className="sr-only">
        Payment
      </h2>

      <Button
        type="button"
        variant="emphasis"
        size="lg"
        disabled={disabled || preparing}
        onClick={onPay}
        className="w-full cursor-pointer"
      >
        {preparing ? "Preparing checkout…" : `Pay ${formatPaise(totalPaise)}`}
      </Button>

      <CheckoutTrustInfo className="mt-4 space-y-1.5" />
    </section>
  );
}
