import Image from "next/image";
import { cn } from "@/lib/cn";

export type LogoTone = "dark" | "light";

const MARK_SIZE = {
  sm: "size-9 sm:size-10",
  md: "size-11 sm:size-12",
} as const;

const TEXT_SIZE = {
  sm: { headline: "text-[25px]", sub: "text-[9px]" },
  md: { headline: "text-[28px]", sub: "text-[10px]" },
} as const;

/**
 * Brand mark + wordmark. Was duplicated verbatim between `Header`'s light
 * branch and `FooterFrame`'s `BrandMark` (text-only, no image, on both) —
 * pulled into one component now that a real mark image exists, so the two
 * chrome pieces can't drift out of sync again.
 *
 * The mark carries its own gold ring baked in from the source art, so it
 * needs no extra border/ring here — just sizing and a circular clip.
 * `size="md"` matches the footer's previously-larger, icon-free wordmark
 * weight; the header stays `sm` (the default) at nav-bar scale.
 */
export function Logo({
  tone = "dark",
  size = "sm",
  priority = false,
}: {
  tone?: LogoTone;
  size?: "sm" | "md";
  /** Set only on the one above-the-fold instance (the header). */
  priority?: boolean;
}) {
  const text = TEXT_SIZE[size];

  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/logo/mark.png"
        alt=""
        width={80}
        height={80}
        priority={priority}
        className={cn("shrink-0 rounded-full", MARK_SIZE[size])}
      />
      {tone === "light" ? (
        <span className="flex items-baseline gap-2.5">
          <span
            className={cn(
              "font-editorial tracking-[0.01em] text-graphite",
              text.headline,
            )}
          >
            Ishraq
          </span>
          <span
            className={cn(
              "font-ui font-semibold uppercase tracking-[0.28em] text-graphite-mute",
              text.sub,
            )}
          >
            Parfums
          </span>
        </span>
      ) : (
        <span
          className={cn(
            "flex items-baseline gap-2.5 font-display font-semibold text-cream-soft",
            text.headline,
          )}
        >
          Ishraq
          <span
            className={cn(
              "font-mono uppercase text-gold-soft/75",
              size === "md" ? "text-label-sm" : "text-[10px]",
            )}
          >
            Parfums
          </span>
        </span>
      )}
    </span>
  );
}
