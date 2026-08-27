"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Composition blurb in the buy column. Long copy clamps to a few lines with
 * inline More / Less so the sticky gallery layout stays stable when collapsed.
 *
 * Ported from product/product-story.tsx: the clamp/expand `ResizeObserver`
 * logic is unchanged. Retinted, and now splits `text` into paragraphs on
 * blank-line boundaries instead of rendering one `whitespace-pre-line` block.
 */
export function ProductStory({ text }: { text: string }) {
  const trimmed = text.trim();
  const paragraphs = trimmed.split(/\n{2,}/).filter(Boolean);
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

  if (paragraphs.length === 0) return null;

  return (
    <div className="border-t border-graphite/10 pt-5">
      <h2 className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-mute">
        The composition
      </h2>
      <div
        ref={bodyRef}
        className={cn(
          "mt-2.5 max-w-prose space-y-3 text-[15px] leading-[1.65] text-graphite-soft",
          !expanded && "line-clamp-4",
        )}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {needsToggle || expanded ? (
        <button
          type="button"
          className="mt-2 cursor-pointer font-ui text-[11px] uppercase tracking-[0.14em] text-graphite underline-offset-2 transition-colors hover:text-graphite-soft hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </div>
  );
}
