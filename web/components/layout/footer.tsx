import { FooterFrame } from "@/components/layout/footer-frame";
import { type FooterNavColumn } from "@/components/layout/footer-mobile-nav";
import { getCollections } from "@/lib/api/catalog";
import { ACCOUNT_HOME, ACCOUNT_ORDERS } from "@/lib/auth/account-routes";
import { getSiteContact } from "@/lib/site/contact";

const STATIC_COLUMNS: FooterNavColumn[] = [
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
      { href: ACCOUNT_HOME, label: "Account" },
      { href: ACCOUNT_ORDERS, label: "Order history" },
      { href: "/cart", label: "Cart" },
    ],
  },
];

/**
 * Server component, so the Shop column can be built from the live collection
 * list rather than hardcoded slugs. Surface (paper vs espresso) lives in
 * FooterFrame so it can follow the route. Link columns and WhatsApp are
 * desktop-only; phone shows wordmark, the India line, and the legal strip.
 */
export async function Footer() {
  const collections = await getCollections();
  const contact = getSiteContact();

  const desktopColumns: FooterNavColumn[] = [
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
    <FooterFrame
      whatsappUrl={contact.whatsappUrl}
      desktopColumns={desktopColumns}
    />
  );
}
