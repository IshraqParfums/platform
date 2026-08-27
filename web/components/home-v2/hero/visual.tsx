import Image from "next/image";
import { cn } from "@/lib/cn";
import { HOME_HERO } from "@/lib/content/home-v2";

/**
 * The hero photograph — one instance for every breakpoint.
 *
 * Positioning is owned by the composer: a normal `relative` block with its
 * own aspect ratio below lg, `relative` filling the desktop column at lg. The
 * composer supplies both via `className` — this wrapper never bakes in its
 * own position/aspect so it doesn't fight whichever the caller sets.
 *
 * Crop: below lg the composer sizes the container by viewport height, not a
 * fixed aspect ratio, so the effective crop ratio shifts with viewport width
 * — object position keeps the bottle (roughly image-centre, sitting a little
 * above the vertical middle) in frame regardless of exactly how wide or
 * short that ends up. At lg push into the wood/citrus so the material enters
 * the split from the right, unchanged from the original desktop crop.
 */
export function HeroVisual({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <Image
        src={HOME_HERO.image.src}
        alt={HOME_HERO.image.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="object-cover object-[50%_40%] lg:object-[70%_40%]"
      />
    </div>
  );
}
