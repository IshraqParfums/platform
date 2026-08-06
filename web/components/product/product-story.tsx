"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Composition blurb in the buy column. Long copy clamps to a few lines with
 * inline More / Less so the sticky gallery layout stays stable when collapsed.
 */
export function ProductStory({ text }: { text: string }) {
  const trimmed = text.trim();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;

    function measure() {
      if (!node || expanded) return;
      // Slight slack so sub-pixel rounding doesn’t flash a useless toggle.
      setNeedsToggle(node.scrollHeight > node.clientHeight + 2);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [trimmed, expanded]);

  if (!trimmed) return null;

  return (
    <div className="border-t border-line/60 pt-5">
      <h2 className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        The composition
      </h2>
      <div
        ref={bodyRef}
        className={cn(
          "mt-2.5 max-w-prose text-[15px] leading-[1.65] text-ink-soft whitespace-pre-line",
          !expanded && "line-clamp-4",
        )}
      >
        {trimmed}
      </div>
      {needsToggle || expanded ? (
        <button
          type="button"
          className="mt-2 cursor-pointer font-mono text-label-sm uppercase tracking-wide text-ink underline-offset-2 transition-colors hover:text-ink-soft hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </div>
  );
}
