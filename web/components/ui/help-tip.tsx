"use client";

import { CircleHelp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Lightweight accessible help popover — no extra deps.
 * Anchors to the right edge of the trigger so it stays in-viewport near
 * page edges. Closes on outside click and Escape.
 */
export function HelpTip({
  label,
  children,
  className,
}: {
  /** Accessible name for the trigger (e.g. "About Needs review"). */
  label: string;
  children: string;
  className?: string;
}) {
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer rounded-full p-0.5 text-ink-faint transition-colors hover:text-ink"
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-md border border-ink/10 bg-cream-soft px-3 py-2 text-left text-xs leading-relaxed text-ink-soft shadow-[0_8px_24px_rgba(28,22,18,0.12)]"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
