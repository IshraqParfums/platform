import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";

/**
 * One full-width editorial row: image on one side, copy on the other.
 * Replaces the old grid-of-overlay-cards layout, which put text on top of
 * photography and squeezed two panels into fixed, cramped heights on every
 * screen size — not just mobile.
 *
 * Text always sits beside the image, never over it, so there's no contrast
 * fight to solve here the way the hero needed a scrim for.
 *
 * Below `lg` the image is a fixed-size thumbnail sitting beside the copy
 * (same differentiator as `TrustStrip`'s icon-left-of-text mobile layout,
 * rather than a stacked full-width photo eating the first screenful) and
 * always stays on the same side — only the `lg` grid alternates sides.
 *
 * The image uses an aspect-ratio up through the tablet breakpoint, then locks
 * to a fixed height at `lg`. An open-ended aspect-ratio inside a wide desktop
 * half-column has no upper bound — `aspect-4/5` in a ~650px column comes out
 * ~810px tall, taller than most laptop viewports for a single row. A fixed
 * height is what the old fixed-`min-h` grid had and this rewrite lost.
 */
export function ExploreRow({
  eyebrow,
  title,
  description,
  href,
  ctaLabel,
  image,
  imageSide = "right",
  accent,
  index,
  delay = 0,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  image: { src: string; alt: string };
  imageSide?: "left" | "right";
  /** Extra content rendered above the CTA — e.g. the Vial motif for Bespoke. */
  accent?: ReactNode;
  index: number;
  delay?: number;
}) {
  const imageFirst = imageSide === "left";
  const number = String(index + 1).padStart(2, "0");

  return (
    <Reveal delay={delay}>
      <div
        className={cn(
          "flex items-start gap-5 sm:gap-6 lg:grid lg:items-center lg:gap-16 lg:grid-cols-2",
          index > 0 && "border-t border-line/50 pt-10 lg:pt-20",
        )}
      >
        {/* Fixed thumbnail beside the copy below `lg`; full-size, alternating
            side at `lg` via `order-*` on both children (mobile keeps natural
            DOM order — image always leads, no flipping, matching TrustStrip's
            icon position never alternating either). */}
        <div className={cn("w-24 shrink-0 sm:w-32 lg:w-full", imageFirst ? "lg:order-1" : "lg:order-2")}>
          <Link
            href={href}
            className="group relative block aspect-4/5 overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(58,36,24,0.06)] ring-1 ring-gold/25 transition-shadow duration-500 hover:shadow-[0_24px_48px_-16px_rgba(58,36,24,0.28)] hover:ring-gold/55 lg:aspect-auto lg:h-[440px] lg:rounded-3xl"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-deep-deeper/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </Link>
        </div>

        <div className={cn("relative", imageFirst ? "lg:order-2" : "lg:order-1")}>
          {/* Oversized ghost numeral — an editorial device that gives each row
              its own identity without adding another line of chrome. Kept
              modest below `lg`, where the copy column shares the row with the
              thumbnail rather than owning the full width. */}
          <span
            aria-hidden="true"
            className="font-display pointer-events-none absolute -top-3 left-0 select-none text-[56px] font-semibold leading-none text-ink/[0.05] lg:-top-10 lg:text-[136px]"
          >
            {number}
          </span>

          <div className="relative">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h3 className="font-display mt-3 text-subsection font-semibold text-ink">
              {title}
            </h3>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
              {description}
            </p>

            {accent}

            <Link
              href={href}
              className="group/cta mt-8 inline-flex items-center gap-2 font-mono text-label uppercase text-rose-deep transition-colors hover:text-ink"
            >
              {ctaLabel}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover/cta:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
