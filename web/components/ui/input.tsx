import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<"input">
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-ink/15 bg-cream px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-ink/30 focus-visible:border-ink/40 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
