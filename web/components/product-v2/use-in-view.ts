"use client";

import { useEffect, useState } from "react";

/**
 * Watches one element and reports whether it is on screen.
 *
 * Two things on this page need this and they want different behaviour:
 *
 * - The arrival's CTA starts visible (so the sticky bar must start hidden),
 *   and plain "is it intersecting" is exactly right for it.
 * - The end-of-content sentinel starts off screen, and plain intersection is
 *   *not* enough: a 1px sentinel stops intersecting the moment you scroll
 *   past it, which would bring the bar back over the footer — the very thing
 *   the sentinel exists to prevent. `includePassed` makes it also count as
 *   active once the element has gone above the viewport, so the state holds
 *   while the footer is on screen and releases when you scroll back up.
 *
 * Returns a callback ref rather than a `RefObject` so the effect re-runs when
 * the node actually mounts — a `useRef` would still be `null` on the first
 * effect pass for anything rendered conditionally.
 */
export function useInView(
  initial: boolean,
  options?: { includePassed?: boolean },
): {
  setNode: (node: HTMLElement | null) => void;
  inView: boolean;
} {
  const includePassed = options?.includePassed ?? false;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(initial);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // `top < 0` means the element has scrolled above the viewport.
          const passed =
            includePassed && entry.boundingClientRect.top < 0;
          setInView(entry.isIntersecting || passed);
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, includePassed]);

  return { setNode, inView };
}
