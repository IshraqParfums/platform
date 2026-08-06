"use client";

import { useEffect, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shop dialog shell — cream panel over a dimmed page.
 * Set `dismissible={false}` for required flows (no Escape / backdrop close).
 */
export function Modal({
  open,
  title,
  children,
  footer,
  dismissible = true,
  onClose,
  className,
  panelClassName,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  onClose?: () => void;
  className?: string;
  panelClassName?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissible) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center",
        className,
      )}
    >
      {dismissible ? (
        <button
          type="button"
          className="absolute inset-0 cursor-pointer bg-deep/45"
          aria-label="Dismiss"
          onClick={() => onClose?.()}
        />
      ) : (
        <div className="absolute inset-0 bg-deep/45" aria-hidden />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 w-full max-w-md border border-ink/10 bg-cream-soft p-6",
          "shadow-[0_16px_40px_rgba(28,22,18,0.18)]",
          panelClassName,
        )}
      >
        <h2
          id={titleId}
          className="font-display text-xl font-semibold tracking-[-0.02em] text-ink"
        >
          {title}
        </h2>
        <div className="mt-2.5">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
