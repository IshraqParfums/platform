import type { Metadata } from "next";
import { ContactChannels } from "@/components/site/contact/contact-channels";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Ishraq Parfums on WhatsApp or email for orders, recommendations, and bespoke requests.",
};

/** Contact page — WhatsApp + email channel cards only. */
export default function ContactPage() {
  return <ContactChannels />;
}
