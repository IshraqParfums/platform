import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

/**
 * A photograph fed into the paper through a soft elliptical mask, so it reads as
 * something resting on the page rather than a pasted rectangle.
 *
 * The mask only does its job on cutout imagery with a real alpha channel — an
 * image carrying its own background gives its edges away regardless of how the
 * mask fades. That constraint is written down for the client in
 * docs/home-image-shot-list.md, and it is the reason the placeholder set is all
 * transparent PNGs.
 *
 * `transform` is passed through for the scroll-pinned section, which drives a
 * scale/translate from measured scroll progress.
 */
export function MaskedPhoto({
  src,
  alt,
  priority = false,
  sizes,
  objectPosition = "center 45%",
  objectFit = "cover",
  transform,
  tight = false,
  className,
}: {
  src: string;
  /** Decorative by default — pass "" when the copy beside it already names the subject. */
  alt: string;
  priority?: boolean;
  sizes: string;
  objectPosition?: string;
  /**
   * "cover" is right for correctly-sized art. "contain" exists for the
   * placeholder set, where an image smaller than its slot would otherwise be
   * upscaled into a blur — see docs/home-image-shot-list.md.
   */
  objectFit?: "cover" | "contain";
  transform?: string;
  /** The tighter mask used where the photo sits in a taller, narrower frame. */
  tight?: boolean;
  className?: string;
}) {
  const style: CSSProperties = { objectPosition, objectFit };

  return (
    <div
      className={cn(
        "absolute inset-0",
        tight ? "photo-mask-tight" : "photo-mask",
        className,
      )}
      style={
        transform
          ? { transform, transition: "transform 0.5s cubic-bezier(0.22,0.61,0.36,1)" }
          : undefined
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={style}
        unoptimized={shouldUnoptimizeImageSrc(src)}
      />
    </div>
  );
}
