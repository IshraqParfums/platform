"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * One panel of the account lobby: a quiet heading, an optional link out, and
 * content. Sections are separated by hairlines rather than boxed in cards —
 * this is a salon card, not a dashboard of tiles. Optional `surface="muted"`
 * gives a soft shell band so adjacent sections read as distinct.
 */
export function AccountSection({
  title,
  action,
  children,
  className,
  surface = "plain",
}: {
  title: string;
  /** Link out, or a custom control (e.g. Edit / Add). */
  action?: { href: string; label: string } | ReactNode;
  children: ReactNode;
  className?: string;
  surface?: "plain" | "muted";
}) {
  const headingId = useId();

  const actionNode =
    action == null ? null : isLinkAction(action) ? (
      <Link
        href={action.href}
        className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint transition-colors duration-200 hover:text-terra focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite/30"
      >
        {action.label}
      </Link>
    ) : (
      action
    );

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "py-7 last:pb-0 sm:py-9",
        surface === "muted" &&
          "-mx-4 rounded-[4px] bg-shell px-4 sm:-mx-5 sm:px-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2
          id={headingId}
          className="font-editorial text-[22px] leading-none text-graphite"
        >
          {title}
        </h2>
        {actionNode ? <div className="shrink-0">{actionNode}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function isLinkAction(
  action: { href: string; label: string } | ReactNode,
): action is { href: string; label: string } {
  return (
    typeof action === "object" &&
    action !== null &&
    "href" in action &&
    "label" in action &&
    typeof (action as { href: unknown }).href === "string"
  );
}

/** Calm line for a section with nothing in it yet — never an error tone. */
export function AccountEmpty({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[15px] leading-relaxed text-graphite-soft", className)}>
      {children}
    </p>
  );
}
