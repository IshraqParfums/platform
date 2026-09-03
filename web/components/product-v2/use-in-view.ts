"use client";

import { useEffect, useState } from "react";

/**
 * Watches one element and reports whether it is on screen, and whether it
 * has scrolled away above the viewport (`hasPassed`).
 *
 * Two things on this page need this and they want different behaviour:
 *
 * - The arrival's CTA is often *below* the fold on a phone first view. The
 *   buy strip must stay hidden until that block has actually gone off the
 *   top (`hasPassed`), not merely because it is not intersecting yet.
 * - The end-of-content sentinel starts off screen, and plain intersection is
 *   *not* enough: a 1px sentinel stops intersecting the moment you scroll
 *   past it, which would bring the bar back over the footer — the very thing
 *   the sentinel exists to prevent. `includePassed` makes `inView` also count
 *   as active once the element has gone above the viewport, so the state
 *   holds while the footer is on screen and releases when you scroll back up.
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
  hasPassed: boolean;
} {
  const includePassed = options?.includePassed ?? false;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(initial);
  const [hasPassed, setHasPassed] = useState(false);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // `top < 0` means the element has scrolled above the viewport.
          const passedAbove = entry.boundingClientRect.top < 0;
          setHasPassed(passedAbove);
          setInView(entry.isIntersecting || (includePassed && passedAbove));
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, includePassed]);

  return { setNode, inView, hasPassed };
}
