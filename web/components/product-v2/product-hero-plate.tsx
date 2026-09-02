"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { ProductDetailImage } from "@ishraqparfums/shared";
import { cn } from "@/lib/cn";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";
import { useHorizontalSwipe } from "@/lib/ui/use-horizontal-swipe";

/**
 * The arrival's photography — and the only place a product's images appear.
 *
 * This used to take a single `image` and the page rendered `images[1]` as a
 * full-bleed block further down, which meant two things were wrong at once:
 * the second photo showed up detached from any control, and everything from
 * `images[2]` on was unreachable — a real product in the catalogue has three
 * photos and the third could not be seen at all.
 *
 * Now it takes the whole ordered array and is the single viewer: arrows,
 * dots, swipe. Chrome only appears when there is more than one image, so a
 * one-photo product looks exactly like a plain plate.
 *
 * Controls sit on a solid paper chip rather than the usual translucent-white
 * ghost — on warm, light-toned product photography a 20%-white control is
 * invisible.
 */
export function ProductHeroPlate({
  name,
  images,
  className,
}: {
  name: string;
  images: ProductDetailImage[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  const count = images.length;
  const active = images[index] ?? null;
  const hasMultiple = count > 1;

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  const { onTouchStart, onTouchEnd } = useHorizontalSwipe(hasMultiple, step);

  return (
    <div
      className={cn(
        "relative h-[52vh] w-full overflow-hidden bg-paper-deep sm:h-[44vh] lg:h-full lg:min-h-[540px]",
        className,
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {active ? (
        <Image
          key={active.url}
          src={active.url}
          alt={active.altText ?? name}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 45vw, 100vw"
          unoptimized={shouldUnoptimizeImageSrc(active.url)}
          className="object-cover"
        />
      ) : (
        <div className="grain flex h-full w-full items-center justify-center">
          <span className="font-editorial text-6xl text-terra/40">
            {name.charAt(0)}
          </span>
        </div>
      )}

      {hasMultiple ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => step(-1)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/90 text-graphite transition-colors hover:bg-paper"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">
              ‹
            </span>
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => step(1)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/90 text-graphite transition-colors hover:bg-paper"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">
              ›
            </span>
          </button>

          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-paper/90 px-3 py-2">
              {images.map((image, dotIndex) => (
                <button
                  key={image.url}
                  type="button"
                  aria-label={`Show image ${dotIndex + 1} of ${count}`}
                  aria-current={dotIndex === index}
                  onClick={() => setIndex(dotIndex)}
                  className={cn(
                    "h-2 w-2 cursor-pointer rounded-full transition-colors",
                    dotIndex === index
                      ? "bg-graphite"
                      : "bg-graphite/30 hover:bg-graphite/50",
                  )}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
