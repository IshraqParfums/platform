"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: ToastAction;
  /** Fires when the toast closes for any reason (timeout, swipe, or action). */
  onDismiss?: () => void;
};

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
          title:
            "font-display text-[15px] font-semibold tracking-[-0.01em] text-ink",
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

function toSonnerOptions(options?: ToastOptions) {
  if (!options) return undefined;
  return {
    description: options.description,
    duration: options.duration,
    action: options.action,
    onDismiss: options.onDismiss,
  };
}

export const toast = {
  success(message: string, descriptionOrOptions?: string | ToastOptions) {
    const options =
      typeof descriptionOrOptions === "string"
        ? { description: descriptionOrOptions }
        : descriptionOrOptions;
    return sonnerToast.success(message, toSonnerOptions(options));
  },
  error(message: string, descriptionOrOptions?: string | ToastOptions) {
    const options =
      typeof descriptionOrOptions === "string"
        ? { description: descriptionOrOptions }
        : descriptionOrOptions;
    return sonnerToast.error(message, toSonnerOptions(options));
  },
  message(message: string, descriptionOrOptions?: string | ToastOptions) {
    const options =
      typeof descriptionOrOptions === "string"
        ? { description: descriptionOrOptions }
        : descriptionOrOptions;
    return sonnerToast(message, toSonnerOptions(options));
  },
  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },
};
