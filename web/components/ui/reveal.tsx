"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Hard ceiling — content must never stay hidden because an observer misfired. */
const FAILSAFE_MS = 1200;

/**
 * One-shot rise-in when a section scrolls into view. Deliberately restrained:
 * no parallax, no re-trigger, and fully bypassed under prefers-reduced-motion
 * (handled in globals.css).
 *
 * Visibility is driven through a data attribute rather than React state. The
 * animation is decoration, so it should never be able to gate whether content
 * is readable — every path here ends with the element shown.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => {
      node.dataset.shown = "true";
    };

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    // Already on screen at mount — covers above-the-fold content and very tall
    // viewports, where an observer may never report a fresh intersection.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    observer.observe(node);

    const failsafe = window.setTimeout(show, FAILSAFE_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
