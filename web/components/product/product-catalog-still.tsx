"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import type { ProductListPrimaryImage } from "@ishraqparfums/shared";
import { cn } from "@/lib/cn";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";
import { useHorizontalSwipe } from "@/lib/ui/use-horizontal-swipe";

const INTERVAL_MS = 2800;
const TAKEOVER_RESUME_MS = 5000;

const HOVER_SCALE =
  "object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100";

const ARROW =
  "absolute top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/90 text-graphite transition-opacity hover:bg-paper md:opacity-0 md:group-hover:opacity-100";

/**
 * Auto-advancing catalog still for shop journal + home collection.
 * One photo stays a still. Several photos cycle on this card only. A swipe
 * or arrow pauses autoplay here for 5s, then it resumes unless the pointer
 * is still hovering. Other cards keep autoplaying. A tap with no swipe
 * still follows the parent Link.
 */
export function ProductCatalogStill({
  name,
  images,
  sizes,
  priority = false,
}: {
  name: string;
  images: ProductListPrimaryImage[];
  sizes: string;
  priority?: boolean;
}) {
  const count = images.length;
  const hasMultiple = count > 1;
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const suppressClick = useRef(false);
  const resumeTimeout = useRef<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  const takeOver = useCallback(
    (delta: number) => {
      setTakenOver(true);
      step(delta);
      if (resumeTimeout.current !== null) {
        window.clearTimeout(resumeTimeout.current);
      }
      resumeTimeout.current = window.setTimeout(() => {
        resumeTimeout.current = null;
        setTakenOver(false);
      }, TAKEOVER_RESUME_MS);
    },
    [step],
  );

  useEffect(() => {
    return () => {
      if (resumeTimeout.current !== null) {
        window.clearTimeout(resumeTimeout.current);
      }
    };
  }, []);

  const onSwipe = useCallback(
    (delta: -1 | 1) => {
      suppressClick.current = true;
      takeOver(delta);
    },
    [takeOver],
  );

  const { onTouchStart, onTouchEnd } = useHorizontalSwipe(hasMultiple, onSwipe);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReduceMotion(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || hoverPaused || takenOver || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, hoverPaused, takenOver, count]);

  if (count === 0) return null;

  const active = Math.min(index, count - 1);

  function onArrowClick(event: MouseEvent<HTMLButtonElement>, delta: number) {
    event.preventDefault();
    event.stopPropagation();
    takeOver(delta);
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setHoverPaused(false);
        }
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }}
    >
      {images.map((image, i) => (
        <Image
          key={image.url}
          src={image.url}
          alt={image.altText?.trim() || name}
          fill
          sizes={sizes}
          priority={priority && i === 0}
          unoptimized={shouldUnoptimizeImageSrc(image.url)}
          className={cn(
            HOVER_SCALE,
            i === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      {hasMultiple ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(event) => onArrowClick(event, -1)}
            className={cn(ARROW, "left-2")}
          >
            <span aria-hidden="true" className="text-[16px] leading-none">
              ‹
            </span>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(event) => onArrowClick(event, 1)}
            className={cn(ARROW, "right-2")}
          >
            <span aria-hidden="true" className="text-[16px] leading-none">
              ›
            </span>
          </button>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-3 z-[1] flex justify-center gap-1.5"
          >
            {images.map((image, i) => (
              <span
                key={image.url}
                className={cn(
                  "h-1 w-1 rounded-full transition-colors duration-300",
                  i === active ? "bg-paper" : "bg-paper/40",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
