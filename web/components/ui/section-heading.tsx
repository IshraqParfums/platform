import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";

function ActionArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

      {action ? (
        <ButtonLink
          href={action.href}
          variant={tone === "light" ? "outline-dark" : "outline"}
          size="sm"
          className="group shrink-0 font-mono text-label uppercase tracking-[0.14em]"
        >
          {action.label}
          <ActionArrow />
        </ButtonLink>
      ) : null}
    </div>
  );
}
