"use client";

import type { InputHTMLAttributes } from "react";
import { checkoutFieldControlClassName } from "@/components/checkout/checkout-field";
import { cn } from "@/lib/cn";

export type CheckoutInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function CheckoutInput({
  invalid,
  className,
  ...rest
}: CheckoutInputProps) {
  return (
    <input
      className={cn(checkoutFieldControlClassName(invalid), className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
