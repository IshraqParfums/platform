"use client";

import Link from "next/link";
import type { NavLinkTone } from "@/components/layout/bespoke-saved-nav-link";
import { cn } from "@/lib/cn";
import { getSiteContact } from "@/lib/site/contact";

/** Same circular control language as cart / saved. */
const CONTROL: Record<NavLinkTone, string> = {
  dark: "text-cream/85 hover:bg-cream/10 hover:text-cream-soft",
  light: "text-graphite/75 hover:bg-graphite/[0.06] hover:text-graphite",
};

/**
 * Shop icon on the phone bar — desktop already has Shop in the centre nav.
 */
export function HeaderShopLink({
  tone = "dark",
  onNavigate,
}: {
  tone?: NavLinkTone;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/shop"
      aria-label="Shop"
      onClick={onNavigate}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden",
        CONTROL[tone],
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-[19px] w-[19px]"
        aria-hidden="true"
      >
        <path
          d="M3 9.5 5.5 5h13L21 9.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M3.5 9.5h17" strokeLinecap="round" />
        <path d="M5 9.5V20h14V9.5" strokeLinejoin="round" />
        <path d="M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 9.5v-2M12 9.5v-2.5M16 9.5v-2" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

/**
 * WhatsApp — phone menu row. Same wa.me as the footer / contact page.
 */
export function HeaderWhatsAppLink({
  tone = "dark",
  onNavigate,
}: {
  tone?: NavLinkTone;
  onNavigate?: () => void;
}) {
  const { whatsappUrl } = getSiteContact();

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 border-b-0 py-4 text-lg",
        tone === "light"
          ? "font-editorial text-graphite"
          : "font-display text-cream-soft",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3.4 4.3c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.3-1.6-1.5-1.9-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.3.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4z" />
      </svg>
      WhatsApp
    </a>
  );
}
