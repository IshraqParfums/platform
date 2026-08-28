import Image from "next/image";
import { cn } from "@/lib/cn";
import { HOME_HERO } from "@/lib/content/home-v2";

/**
 * The hero photograph, in its two presentations.
 *
 * From sm it is the dawn aperture: an arched, brass-framed window standing
 * on the section's floor with warm light behind it. Ishraq is radiance,
 * dawn (Belief spells that out at the foot of the page), and this is where
 * the page says it in a shape rather than in a sentence. It replaces a
 * plain rectangular photo panel, which read as a stock image dropped beside
 * a column of type.
 *
 * Below sm every piece of that furniture is dropped and the still becomes
 * the ground the centred type stands on instead — see `.hero-field` in
 * globals.css. A phone has no room for a window *and* a headline, and a
 * small arch there was neither.
 *
 * Layers, back to front, at sm and up:
 *
 *   1. the light — a brass radial wash bleeding past the arch on every
 *      side, breathing on a 16s cycle. This is the only element on the
 *      paper surface allowed to glow, and it is doing a job: it separates
 *      the near-black photograph from the parchment, which otherwise meet
 *      as a hard cut.
 *   2. a concentric outline one step larger than the arch — a printer's
 *      registration mark. Concentric, not offset, so it reads as deliberate
 *      rather than as a misprint.
 *   3. the aperture: the photograph behind a paper curtain that drops away
 *      on load (`.aperture-curtain`).
 *
 * Sizing and placement belong to the composer, which passes them through
 * `className` — including `position`, which the caller MUST supply, and
 * which must establish a containing block (`absolute`, `relative` or
 * `fixed`) because the light, the frame and the curtain are all positioned
 * against this root.
 *
 * This root deliberately hardcodes no position of its own. It used to carry
 * `relative`, and a caller passing `absolute` through `className` silently
 * lost: `cn()` is a plain string join with no Tailwind conflict resolution,
 * so both classes land in the attribute and the winner is decided by
 * stylesheet order, where `.relative` is emitted after `.absolute`. The arch
 * then stopped being sized by its own `top`/`bottom` and collapsed to the
 * height of its border. Same trap `Button` and `Urdu` document for colour.
 */
export function HeroAperture({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn(className)}>
      {/*
        The ellipse is sized explicitly, and that is load-bearing. Left to
        its `farthest-corner` default it reaches transparent along the
        diagonal but is still painting colour where it meets the left and
        right edges of its own box, so the wash ended in a hard vertical
        seam down the parchment either side of the arch. Radii under 50%
        with the centre at 50% guarantee it has faded out before any edge.
      */}
      <span
        aria-hidden="true"
        className="dawn-breathe pointer-events-none absolute -inset-x-[26%] -top-[12%] -bottom-[8%] hidden bg-[radial-gradient(ellipse_46%_36%_at_50%_44%,rgba(181,122,25,0.40),rgba(181,122,25,0.12)_48%,transparent_76%)] sm:block"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-4 -right-4 -top-4 bottom-0 hidden rounded-t-[999px] border border-brass/25 sm:block lg:-left-5 lg:-right-5 lg:-top-5"
      />

      {/* `bg-tobacco` under the photograph, not paper: the arch should read
          as a dark opening from the first frame, so a slow-loading image
          never flashes the parchment through its own window. */}
      <div className="hero-field relative h-full w-full overflow-hidden sm:rounded-t-[999px] sm:border sm:border-brass/35 sm:bg-tobacco">
        <Image
          src={HOME_HERO.image.src}
          alt={HOME_HERO.image.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 430px, (min-width: 640px) 300px, 100vw"
          /* The still is portrait and the arch is taller still, so the crop
             is mostly a vertical decision: hold the oud chips and the smoke
             above them, and keep the empty table top out of frame. */
          className="hero-breath object-cover object-[50%_60%]"
        />

        <span
          aria-hidden="true"
          className="aperture-curtain absolute inset-0 hidden bg-paper sm:block"
        />
      </div>
    </div>
  );
}
