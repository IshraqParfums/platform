import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  align?: "left" | "center";
  /** `dark` = ink text on cream, `light` = cream text on espresso. */
  tone?: "dark" | "light";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center",
        className,
      )}
    >
      {/* Wide enough that a two-word-per-line wrap can't happen at the top of
          the type ramp; the description is constrained separately. */}
      <div className={cn("max-w-3xl", centered && "text-center")}>
        {eyebrow && (
          <Eyebrow tone={tone === "light" ? "gold" : "rose"} className="mb-4">
            {eyebrow}
          </Eyebrow>
        )}
        <h2
          className={cn(
            "font-display text-section font-semibold",
            tone === "light" ? "text-cream-soft" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-5 max-w-2xl text-[15.5px] leading-relaxed",
              tone === "light" ? "text-cream/70" : "text-ink-soft",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 font-mono text-label uppercase transition-colors",
            tone === "light"
              ? "text-gold-soft hover:text-gold-pale"
              : "text-rose-deep hover:text-ink",
          )}
        >
          {action.label}
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      )}
    </div>
  );
}
