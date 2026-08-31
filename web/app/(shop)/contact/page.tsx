import type { Metadata } from "next";
import { ContactChannels } from "@/components/site/contact/contact-channels";
import { StaticPage } from "@/components/site/static-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Ishraq Parfums on WhatsApp or email for orders, recommendations, and bespoke requests.",
};

/** Contact page — WhatsApp + email channel cards only. */
export default function ContactPage() {
  return (
    <StaticPage
      kicker="Reach us"
      title="Reach us at."
      // URDU: "رابطہ" ("contact / connection") is new and unreviewed, same
      // as the other Urdu lines added across the paper-storefront migration.
      urdu="رابطہ"
      description="Message the people who compose and bottle every fragrance — not a ticket queue."
    >
      <ContactChannels />
    </StaticPage>
  );
}
