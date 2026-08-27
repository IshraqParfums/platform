import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "emphasis"
  | "outline"
  | "outline-dark"
  | "ghost"
  | "light"
  | "graphite"
  | "ink"
  | "outline-paper"
  | "on-tobacco";
type Size = "sm" | "md" | "lg" | "pill";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-200 " +
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

  // ---- v2 home. Terra is the only accent colour with real presence on
  // paper — gold is decorative there, so a gold button and a gold rule
  // would read the same. Deepens rather than lightens on hover for the
  // reason spelled out under `emphasis` — on a light ground, lightening
  // reads as retreating.
  graphite: "bg-graphite text-shell hover:bg-graphite-lift",
  // Shadow grows on hover alongside BASE's lift, so it reads as rising off
  // the page rather than just nudging up.
  ink:
    "bg-graphite text-paper shadow-[0_1px_3px_rgba(22,19,16,0.18)] " +
    "hover:bg-tobacco hover:shadow-[0_18px_32px_-14px_rgba(22,19,16,0.5)]",
  // Fill-sweep: a solid wash of colour wipes in from the left on hover (the
  // `before` pseudo, scaled from 0), rather than just tinting the border
  // and text — the outline reads as a real second state, not a weaker copy
  // of the solid `ink` button. `isolate` keeps the pseudo's negative
  // z-index scoped to this element instead of bleeding into whatever
  // stacking context sits behind it. Terra, not indigo — terra is the only
  // accent colour with any real presence elsewhere on the v2 home page.
  "outline-paper":
    "relative isolate overflow-hidden border border-graphite/35 text-graphite " +
    "before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-terra " +
    "before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.22,0.8,0.28,1)] " +
    "hover:border-terra hover:text-paper hover:before:scale-x-100",
  "on-tobacco":
    "border border-paper/35 text-paper hover:border-brass hover:text-brass",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-[15px]",
  // v2 home: the CTA is a tracked uppercase micro-label, not a sentence.
  pill: "px-8 py-[18px] text-[12px] uppercase tracking-[0.16em]",
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
