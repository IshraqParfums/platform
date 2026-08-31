"use client";

import type { InputHTMLAttributes } from "react";
import { fieldControlClassName } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/**
 * Paper/graphite text input, paired with `ui/field.tsx`'s `FormField`.
 * Named apart from `ui/input.tsx` (a v1 admin `Input` with different
 * chrome) to avoid colliding with that unrelated, still-in-use component.
 */
export function FormInput({ invalid, className, ...rest }: FormInputProps) {
  return (
    <input
      className={cn(fieldControlClassName(invalid), className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
