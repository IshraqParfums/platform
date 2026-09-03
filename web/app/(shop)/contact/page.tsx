import type { Metadata } from "next";
import { ContactChannels } from "@/components/site/contact/contact-channels";
import { StaticPage } from "@/components/site/static-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Ishraq Parfums on WhatsApp for orders, recommendations, and bespoke requests.",
};

/** Contact page — WhatsApp for now; email stays wired but hidden. */
export default function ContactPage() {
  return (
    <StaticPage
      kicker="Reach us"
      title="Reach us at."
      description="Message the people who compose and bottle every fragrance, not a ticket queue."
    >
      <ContactChannels />
    </StaticPage>
  );
}
