import type { LegalDocumentContent } from "@/lib/site/legal-types";

/**
 * Terms & Conditions content for Version 1.
 * Update `effectiveLabel` when the terms meaningfully change.
 */
export const termsContent: LegalDocumentContent = {
  slug: "terms",
  title: "Terms & Conditions",
  description:
    "Terms that apply when you use the Ishraq Parfums website and place orders.",
  effectiveLabel: "Effective 7 August 2026",
  intro:
    "These terms govern your use of the Ishraq Parfums website and any orders you place with us. By using the site or completing a purchase, you agree to them.",
  sections: [
    {
      id: "about",
      title: "About the service",
      paragraphs: [
        "Ishraq Parfums sells ready-made and bespoke perfume products online. Product descriptions, images, and prices are shown on the site. We may update catalogue details, stock, or pricing without prior notice.",
      ],
    },
    {
      id: "accounts",
      title: "Accounts",
      paragraphs: [
        "Some features require signing in with a one-time code sent to your WhatsApp number. You are responsible for activity under your signed-in session. Keep access to that phone number secure.",
      ],
    },
    {
      id: "orders",
      title: "Orders and payment",
      paragraphs: [
        "An order is an offer to buy. We confirm it after successful payment (or as otherwise stated at checkout). Prices are in Indian Rupees unless noted otherwise. A flat shipping charge may apply as shown at checkout.",
        "Payment is handled by Razorpay. If payment fails or is not completed, the order may not be fulfilled and stock may be released.",
      ],
    },
    {
      id: "bespoke",
      title: "Bespoke products",
      paragraphs: [
        "Bespoke blends are composed from your questionnaire answers. Once ordered, they may be made to order. Every bespoke bottle includes a complimentary 2 ml divergent sample; the sample is not sold separately and is not a cart line. Availability, sizing, and pricing follow what is shown when you add a formula to your cart. Saved formulas can be deleted from your account; if a deleted formula is still in a cart, checkout for that line will be blocked.",
      ],
    },
    {
      id: "shipping",
      title: "Shipping and delivery",
      paragraphs: [
        "We ship within India according to the addresses and options available at checkout. Delivery estimates are indicative, not guarantees. Risk of loss passes according to our fulfilment practice and applicable law once the order is handed to the carrier.",
      ],
    },
    {
      id: "returns",
      title: "Support and returns",
      paragraphs: [
        "Perfume is a personal product. If something arrives damaged, incorrect, or incomplete, contact us promptly with your order details. We will work with you on a fair resolution. Version 1 does not offer self-serve order cancellation in the account area.",
      ],
    },
    {
      id: "reviews",
      title: "Reviews",
      paragraphs: [
        "Reviews must be honest and relevant. We may remove content that is abusive, unlawful, or unrelated to the product. Verified buyer labels reflect purchase history where our systems can confirm it.",
      ],
    },
    {
      id: "ip",
      title: "Intellectual property",
      paragraphs: [
        "Site content (including names, copy, imagery, and design) belongs to Ishraq Parfums or its licensors. You may not copy or reuse it for commercial purposes without permission.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, Ishraq Parfums is not liable for indirect or consequential losses arising from use of the site or products. Our liability for any order is limited to the amount you paid for that order.",
      ],
    },
    {
      id: "law",
      title: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of India. Courts in India have exclusive jurisdiction, subject to any mandatory consumer protections that apply to you.",
      ],
    },
    {
      id: "changes",
      title: "Changes",
      paragraphs: [
        "We may update these terms as the service evolves. The effective date at the top will change when we do. Continued use after an update constitutes acceptance of the revised terms.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Questions about these terms: use the channels on our Contact page.",
      ],
    },
  ],
};
