"use client";

import type { InputHTMLAttributes } from "react";
import { fieldControlClassName } from "@/components/checkout/form-field";
import { cn } from "@/lib/cn";

export type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function FormInput({ invalid, className, ...rest }: FormInputProps) {
  return (
    <input
      className={cn(fieldControlClassName(invalid), className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
