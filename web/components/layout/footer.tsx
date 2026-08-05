import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCollections } from "@/lib/api/catalog";

const STATIC_COLUMNS = [
  {
    title: "Bespoke",
    links: [
      { href: "/bespoke", label: "How it works" },
      { href: "/bespoke/quiz", label: "Take the quiz" },
      { href: "/bespoke/saved", label: "Saved formulas" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/account/orders", label: "Order history" },
      { href: "/cart", label: "Cart" },
    ],
  },
];

/**
 * Server component, so the Shop column can be built from the live collection
 * list rather than hardcoded slugs — those would 404 or go stale the moment a
 * collection is renamed, added or archived. `getCollections()` is ISR-cached
 * and already degrades to an empty array, in which case the column falls back
 * to just the catalog link.
 */
export async function Footer() {
  const collections = await getCollections();

  const columns = [
    {
      title: "Shop",
      links: [
        { href: "/shop", label: "All perfumes" },
        ...collections.map((collection) => ({
          href: `/shop?collection=${collection.slug}`,
          label: collection.name,
        })),
      ],
    },
    ...STATIC_COLUMNS,
  ];

  return (
    <footer className="grain relative overflow-hidden bg-deep-deeper text-cream/70">
      <div className="h-px w-full rule-gold opacity-40" />

      <Container size="wide">
        <div className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-20">
          <div className="max-w-sm">
            <p className="font-display text-2xl font-semibold text-cream-soft">
              Ishraq
              <span className="ml-2 font-mono text-label-sm uppercase text-gold-soft/75">
                Parfums
              </span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-cream/60">
              Small-batch perfumery built from a real perfumer&apos;s palette.
              Composed and bottled in India.
            </p>

            <a
              href="https://wa.me/919000000000"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream/20 px-5 py-3 text-meta font-medium text-cream/85 transition-colors hover:border-gold/50 hover:text-cream-soft"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3.4 4.3c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.3-1.6-1.5-1.9-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.3.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <Eyebrow tone="gold" className="mb-5">
                {col.title}
              </Eyebrow>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-meta text-cream/70 transition-colors hover:text-cream-soft"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 border-t border-cream/10 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-label-sm uppercase text-cream/50">
            © {new Date().getFullYear()} Ishraq Parfums
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/privacy"
              className="text-meta text-cream/60 transition-colors hover:text-cream-soft"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-meta text-cream/60 transition-colors hover:text-cream-soft"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-meta text-cream/60 transition-colors hover:text-cream-soft"
            >
              Contact
            </Link>
            <span className="flex items-center gap-2 rounded-full border border-cream/12 px-3 py-1.5 font-mono text-label-sm uppercase text-cream/55">
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
              Secured by Razorpay
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
