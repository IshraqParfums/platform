"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Size = "md" | "xl";

const SIZES: Record<Size, string> = {
  md: "max-w-md max-h-[min(90dvh,44rem)]",
  xl: "max-w-4xl max-h-[min(92dvh,56rem)]",
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

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
  size = "md",
  onClose,
  className,
  panelClassName,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  size?: Size;
  onClose?: () => void;
  className?: string;
  panelClassName?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissible) {
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null || node === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex w-full flex-col outline-none",
          SIZES[size],
          "border border-ink/10 bg-cream-soft shadow-[0_16px_40px_rgba(28,22,18,0.18)]",
          panelClassName,
        )}
      >
        <div className="shrink-0 px-6 pt-6">
          <h2
            id={titleId}
            className="font-display text-xl font-semibold tracking-[-0.02em] text-ink"
          >
            {title}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-2.5 pb-2">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-ink/[0.06] px-6 py-4">
            {footer}
          </div>
        ) : (
          <div className="shrink-0 pb-6" aria-hidden />
        )}
      </div>
    </div>
  );
}
