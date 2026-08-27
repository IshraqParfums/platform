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
 * — object position keeps the oud chips and smoke (lower-centre of the still)
 * in frame. At lg keep that same material in the split, slightly toward the
 * chips rather than the empty wood at the top.
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
        className="object-cover object-[50%_58%] lg:object-[48%_62%]"
      />
    </div>
  );
}
