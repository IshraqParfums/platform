"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Size = "md" | "xl";
type Theme = "v1" | "v2";

const SIZES: Record<Size, string> = {
  md: "max-w-md max-h-[min(90dvh,44rem)]",
  xl: "max-w-4xl max-h-[min(92dvh,56rem)]",
};

/**
 * Panel chrome and title style, keyed by surface. A themed variant lookup,
 * not a `className`/`panelClassName` override — those merge via `cn()`,
 * a plain join with no Tailwind conflict resolution, so a conflicting
 * `bg-shell` passed in from outside wouldn't reliably beat the default
 * `bg-cream-soft` (see the note on this exact trap in `ui/button.tsx`).
 * `v1` (default) keeps every existing call site pixel-identical.
 */
const THEMES: Record<Theme, { panel: string; title: string }> = {
  v1: {
    panel:
      "border border-ink/10 bg-cream-soft shadow-[0_16px_40px_rgba(28,22,18,0.18)]",
    title: "font-display text-xl font-semibold tracking-[-0.02em] text-ink",
  },
  v2: {
    panel:
      "border border-graphite/10 bg-shell shadow-[0_24px_60px_-30px_rgba(22,19,16,0.55)]",
    title: "font-editorial text-xl text-graphite tracking-[-0.01em]",
  },
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

/**
 * Shop dialog shell — cream panel over a dimmed page.
 * Portaled to `document.body` so `Band`'s `relative z-[1]` stacking context
 * cannot clip or bury the overlay under the next section.
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
  theme = "v1",
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
  /** `v2` swaps panel + title chrome to the paper/graphite surface. */
  theme?: Theme;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  return createPortal(
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
          THEMES[theme].panel,
          panelClassName,
        )}
      >
        <div className="shrink-0 px-6 pt-6">
          <h2 id={titleId} className={THEMES[theme].title}>
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
    </div>,
    document.body,
  );
}
