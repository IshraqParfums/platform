"use client";

import { useEffect, useId } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Shown after a guest add — educate that the cart lives on this device.
 */
export function CartGuestSavedModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-deep/45"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md border border-ink/10 bg-cream-soft p-6 shadow-[0_16px_40px_rgba(28,22,18,0.18)]"
      >
        <h2
          id={titleId}
          className="font-display text-xl font-semibold tracking-[-0.02em] text-ink"
        >
          Saved on this device
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">
          Your cart is stored in this browser for now. Sign in to keep it in
          your account and open it on any device.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <ButtonLink
            href="/login?next=/cart"
            variant="emphasis"
            size="md"
            className="w-full cursor-pointer"
          >
            Sign in
          </ButtonLink>
          <ButtonLink
            href="/cart"
            variant="outline"
            size="md"
            className="w-full cursor-pointer"
          >
            View cart
          </ButtonLink>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full cursor-pointer text-ink-soft"
            autoFocus
            onClick={onClose}
          >
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
