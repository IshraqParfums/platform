import Image from "next/image";
import { cn } from "@/lib/cn";

const FLOAT = {
  a: "material-float material-float--a",
  b: "material-float material-float--b",
  c: "material-float material-float--c",
  d: "material-float material-float--d",
} as const;

export type SpecimenFloat = keyof typeof FLOAT;

/** Shared visual mass so rose’s taller crop doesn’t dominate. */
export function Specimen({
  src,
  alt,
  float = "a",
  className,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  float?: SpecimenFloat;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative", FLOAT[float], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className="object-contain drop-shadow-[0_18px_28px_rgba(22,19,16,0.14)]"
      />
    </div>
  );
}
