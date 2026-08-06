import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "emphasis"
  | "outline"
  | "outline-dark"
  | "ghost"
  | "light";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[transform,background-color,border-color,color] duration-200 " +
  "ease-[cubic-bezier(0.22,0.8,0.28,1)] hover:-translate-y-0.5 active:translate-y-0 " +
  "disabled:pointer-events-none disabled:opacity-55 whitespace-nowrap";

/**
 * Colour lives here, not in a caller's `className`. `cn()` is a plain string
 * join with no Tailwind conflict resolution, so a `text-*`/`bg-*`/`border-*`
 * passed via `className` doesn't override these — it sits alongside them, and
 * the winner is decided by stylesheet order rather than call-site intent. This
 * is exactly the bug `Eyebrow` had (see its comment): a hardcoded colour class
 * silently beat an override for months because it happened to be emitted
 * later in the compiled CSS. Add a new `Variant` instead of trying to tint an
 * existing one from outside.
 */
const VARIANTS: Record<Variant, string> = {
  // Soft gold — marketing surfaces where primary shouldn’t overpower
  // photography. It lightens on hover because it sits on espresso, where
  // lifting toward the light is what reads as "live".
  primary: "bg-gold-soft text-deep hover:bg-gold-pale",
  // Money and commitment on cream: Add to cart, Post review, Proceed to
  // checkout, Pay, Sign in. Warm metal — full gold at rest, deeper under the
  // cursor, deeper still on press. Never lighter: on cream, lightening washes
  // the button toward the background exactly as the customer commits.
  emphasis:
    "bg-gold text-deep hover:bg-gold-deep active:bg-gold-deeper",
  // On cream.
  outline:
    "border border-ink/25 text-ink hover:border-ink/50 hover:bg-ink/5",
  // On espresso. `border-current/30` was far too faint here and made the
  // secondary hero CTA read as ghost text.
  "outline-dark":
    "border border-cream/35 text-cream-soft hover:border-gold/70 hover:bg-cream/10",
  ghost: "text-current hover:bg-current/5",
  light: "bg-ink text-cream-soft hover:bg-rose-deep",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-[15px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
