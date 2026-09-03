/**
 * Public contact channels for the storefront.
 * One source of truth for footer, /contact, and any future CTAs.
 *
 * These are brand details, not secrets — keep them here, not in env.
 * WhatsApp: E.164 digits only (country code included, no + or spaces).
 */
const WHATSAPP_E164_DIGITS = "919060775270";
const SUPPORT_EMAIL = "hello@ishraqparfums.com";

export type SiteContact = {
  whatsappDigits: string;
  whatsappUrl: string;
  whatsappDisplay: string;
  email: string;
  mailtoUrl: string;
};

function formatIndianWhatsAppDisplay(digits: string): string {
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return `+${digits}`;
}

export function getSiteContact(): SiteContact {
  return {
    whatsappDigits: WHATSAPP_E164_DIGITS,
    whatsappUrl: `https://wa.me/${WHATSAPP_E164_DIGITS}`,
    whatsappDisplay: formatIndianWhatsAppDisplay(WHATSAPP_E164_DIGITS),
    email: SUPPORT_EMAIL,
    mailtoUrl: `mailto:${SUPPORT_EMAIL}`,
  };
}

/**
 * Flip on when a public support address is settled. The address itself
 * stays in `SUPPORT_EMAIL` so we don't re-thread it later.
 */
export const SHOW_CONTACT_EMAIL = false;

export const CONTACT_CHANNELS = {
  whatsapp: {
    label: "WhatsApp",
    blurb: "The fastest way to reach us.",
    uses: [
      "Order updates",
      "Fragrance recommendations",
      "Bespoke requests",
    ] as const,
    cta: "Chat on WhatsApp",
  },
  email: {
    label: "Email",
    blurb:
      "For collaborations, wholesale enquiries and longer conversations.",
    uses: ["Wholesale", "Collaborations", "Custom enquiries"] as const,
    cta: "Send email",
  },
} as const;
