"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type FooterNavColumn = {
  title: string;
  links: { href: string; label: string }[];
};

export type FooterNavTone = "paper" | "espresso";

/**
 * Mobile-only accordion for footer link groups. Not mounted today — phone
 * footer is brand + WhatsApp + legal. Keep this for a later sitemap if needed.
 * Desktop columns stay in FooterFrame.
 */
export function FooterMobileNav({
  columns,
  tone = "espresso",
}: {
  columns: FooterNavColumn[];
  tone?: FooterNavTone;
}) {
  const baseId = useId();
  const [openTitle, setOpenTitle] = useState<string | null>(
    columns[0]?.title ?? null,
  );
  const paper = tone === "paper";

  return (
    <div className={paper ? "border-t border-graphite/10" : "border-t border-cream/10"}>
      {columns.map((col) => {
        const open = openTitle === col.title;
        const panelId = `${baseId}-${col.title}`;
        return (
          <div
            key={col.title}
            className={
              paper ? "border-b border-graphite/10" : "border-b border-cream/10"
            }
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
              onClick={() =>
                setOpenTitle((current) =>
                  current === col.title ? null : col.title,
                )
              }
            >
              <span
                className={cn(
                  "text-[13px]",
                  paper
                    ? "text-terra"
                    : "font-mono text-label-sm uppercase tracking-[0.14em] text-gold-soft/80",
                )}
              >
                {col.title}
              </span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                  paper ? "text-graphite-faint" : "text-cream/45",
                  open && "rotate-180",
                )}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              id={panelId}
              role="region"
              hidden={!open}
              className={cn(!open && "hidden")}
            >
              <ul className="flex flex-col gap-3.5 pb-5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "block py-0.5 text-[15px] transition-colors",
                        paper
                          ? "text-graphite-soft hover:text-graphite"
                          : "text-cream/70 hover:text-cream-soft",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
