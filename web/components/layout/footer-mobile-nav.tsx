"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type FooterNavColumn = {
  title: string;
  links: { href: string; label: string }[];
};

/**
 * Mobile-only accordion for footer link groups.
 * Desktop columns stay in Footer — this is purpose-built for thumbs.
 */
export function FooterMobileNav({ columns }: { columns: FooterNavColumn[] }) {
  const baseId = useId();
  const [openTitle, setOpenTitle] = useState<string | null>(columns[0]?.title ?? null);

  return (
    <div className="border-t border-cream/10">
      {columns.map((col) => {
        const open = openTitle === col.title;
        const panelId = `${baseId}-${col.title}`;
        return (
          <div key={col.title} className="border-b border-cream/10">
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
              <span className="font-mono text-label-sm uppercase tracking-[0.14em] text-gold-soft/80">
                {col.title}
              </span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-cream/45 transition-transform duration-200",
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
                      className="block py-0.5 text-[15px] text-cream/70 transition-colors hover:text-cream-soft"
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
