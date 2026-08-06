"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

/**
 * Brand-styled toast host — mount once in the shop layout.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={10}
      offset={20}
      duration={3200}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-ink/10 bg-cream-soft text-ink shadow-[0_14px_36px_-18px_rgba(28,22,18,0.35)]",
          title: "font-display text-[15px] font-semibold tracking-[-0.01em] text-ink",
          description: "font-sans text-[13px] text-ink-soft",
          actionButton:
            "rounded-full bg-gold text-deep font-semibold text-xs",
          cancelButton:
            "rounded-full border border-ink/15 bg-transparent text-ink-soft text-xs",
          success: "border-ink/10",
          error: "border-rose-deep/25",
        },
      }}
    />
  );
}

export const toast = {
  success(message: string, description?: string) {
    return sonnerToast.success(message, { description });
  },
  error(message: string, description?: string) {
    return sonnerToast.error(message, { description });
  },
  message(message: string, description?: string) {
    return sonnerToast(message, { description });
  },
};
