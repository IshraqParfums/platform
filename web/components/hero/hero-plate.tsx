import Image from "next/image";

/**
 * Full-bleed photographic hero background. Landscape smoke plate covers the
 * section edge-to-edge (`object-cover`) so the dark section fill never shows
 * as side pillars. Soft edge mask dissolves into `bg-deep` at the extremes.
 *
 * Motion is a camera breath — `scale` only, never translation.
 */
export function HeroPlate({ opacity = 0.92 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="hero-breath absolute inset-[-2%] origin-center">
        <div className="hero-plate relative h-full w-full" style={{ opacity }}>
          <Image
            src="/hero/hero-bg.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}
