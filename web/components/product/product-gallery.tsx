"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductDetailImage } from "@ishraqparfums/shared";
import { cn } from "@/lib/cn";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

function ImageFallback({ name }: { name: string }) {
  return (
    <div className="grain relative flex h-full w-full items-center justify-center bg-paper-deep">
      <span className="font-editorial text-5xl text-terra/40">
        {name.charAt(0)}
      </span>
    </div>
  );
}

/**
 * Product gallery with optional thumbnails. Aspect is shorter than square on
 * tablet/desktop so the buy column stays above the fold.
 * Ported from product/product-gallery.tsx: same thumbnail-state logic, v2 tokens.
 */
export function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: ProductDetailImage[];
}) {
  const ordered = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = ordered[activeIndex] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] w-full max-h-[min(68vh,560px)] overflow-hidden rounded-2xl bg-paper-deep ring-1 ring-graphite/15 md:aspect-[3/4]">
        {active ? (
          <Image
            src={active.url}
            alt={active.altText ?? name}
            fill
            priority
            sizes="(min-width:768px) 45vw, 100vw"
            unoptimized={shouldUnoptimizeImageSrc(active.url)}
            className="object-cover"
          />
        ) : (
          <ImageFallback name={name} />
        )}
      </div>

      {ordered.length > 1 ? (
        <ul
          className="flex flex-wrap gap-2"
          aria-label="Product images"
        >
          {ordered.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <li key={`${image.url}-${index}`}>
                <button
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={selected}
                  className={cn(
                    "relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg ring-1 transition-[box-shadow,ring-color] duration-200",
                    selected
                      ? "ring-2 ring-graphite"
                      : "ring-graphite/15 hover:ring-graphite/40",
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.altText ?? `${name} ${index + 1}`}
                    fill
                    sizes="64px"
                    unoptimized={shouldUnoptimizeImageSrc(image.url)}
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
