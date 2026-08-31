"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FooterMobileNav,
  type FooterNavColumn,
} from "@/components/layout/footer-mobile-nav";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";
import { isPaperStorefrontPath } from "@/lib/layout";

/**
 * Palette fork for the shared footer. Structure and links stay in Footer;
 * this reads the path and paints parchment on v2 routes, espresso elsewhere.
 */
export function FooterFrame({
  whatsappUrl,
  desktopColumns,
  mobileColumns,
}: {
  whatsappUrl: string;
  desktopColumns: FooterNavColumn[];
  mobileColumns: FooterNavColumn[];
}) {
  const paper = isPaperStorefrontPath(usePathname());

  return (
    <footer
      className={
        paper
          ? "relative bg-paper text-graphite-soft"
          : "grain relative overflow-hidden bg-deep-deeper text-cream/70"
      }
    >
      {paper ? (
        <div className="h-px w-full bg-graphite/10" />
      ) : (
        <div className="h-px w-full rule-gold opacity-40" />
      )}

      <Container size="wide">
        <div className="max-w-sm pt-12 md:hidden">
          <BrandMark paper={paper} />
          <p
            className={cn(
              "mt-4 text-sm leading-relaxed",
              paper ? "text-graphite-soft" : "text-cream/60",
            )}
          >
            Small-batch perfumery built from a real perfumer&apos;s palette.
            Composed and bottled in India.
          </p>
          <WhatsAppPill href={whatsappUrl} paper={paper} className="mt-6 min-h-11" />
        </div>

        <div className="mt-8 md:hidden">
          <FooterMobileNav columns={mobileColumns} tone={paper ? "paper" : "espresso"} />
        </div>

        <div className="hidden gap-12 py-16 md:grid md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-20">
          <div className="max-w-sm">
            <BrandMark paper={paper} />
            <p
              className={cn(
                "mt-4 text-sm leading-relaxed",
                paper ? "text-graphite-soft" : "text-cream/60",
              )}
            >
              Small-batch perfumery built from a real perfumer&apos;s palette.
              Composed and bottled in India.
            </p>
            <WhatsAppPill href={whatsappUrl} paper={paper} className="mt-6" />
          </div>

          {desktopColumns.map((col) => (
            <div key={col.title}>
              {paper ? (
                <p className="mb-5 text-[13px] text-terra">{col.title}</p>
              ) : (
                <Eyebrow tone="gold" className="mb-5">
                  {col.title}
                </Eyebrow>
              )}
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-meta transition-colors",
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
          ))}
        </div>

        <div
          className={cn(
            "flex flex-col gap-5 border-t py-7 sm:flex-row sm:items-center sm:justify-between",
            paper ? "border-graphite/10" : "border-cream/10 md:border-cream/10",
          )}
        >
          <p
            className={cn(
              "font-mono text-label-sm uppercase",
              paper ? "text-graphite-faint" : "text-cream/50",
            )}
          >
            © {new Date().getFullYear()} Ishraq Parfums
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/privacy"
              className={cn(
                "text-meta transition-colors",
                paper
                  ? "text-graphite-soft hover:text-graphite"
                  : "text-cream/60 hover:text-cream-soft",
              )}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className={cn(
                "text-meta transition-colors",
                paper
                  ? "text-graphite-soft hover:text-graphite"
                  : "text-cream/60 hover:text-cream-soft",
              )}
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className={cn(
                "text-meta transition-colors",
                paper
                  ? "text-graphite-soft hover:text-graphite"
                  : "text-cream/60 hover:text-cream-soft",
              )}
            >
              Contact
            </Link>
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-label-sm uppercase",
                paper
                  ? "border-graphite/20 text-graphite-faint"
                  : "border-cream/12 text-cream/55",
              )}
            >
              <LockIcon />
              Secured by Razorpay
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function BrandMark({ paper }: { paper: boolean }) {
  return <Logo tone={paper ? "light" : "dark"} size="md" />;
}

function WhatsAppPill({
  href,
  paper,
  className,
}: {
  href: string;
  paper: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-meta font-medium transition-colors",
        paper
          ? "border-graphite/20 text-graphite hover:border-graphite/40"
          : "border-cream/20 text-cream/85 hover:border-gold/50 hover:text-cream-soft",
        className,
      )}
    >
      <WhatsAppIcon />
      Chat on WhatsApp
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3.4 4.3c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.3-1.6-1.5-1.9-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.3.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
