import type { LegalDocumentContent } from "@/lib/site/legal-types";

/**
 * Privacy Policy content for Version 1.
 * Update `effectiveLabel` when the policy meaningfully changes.
 */
export const privacyContent: LegalDocumentContent = {
  slug: "privacy",
  title: "Privacy Policy",
  description:
    "How Ishraq Parfums collects, uses, and protects your information.",
  effectiveLabel: "Effective 7 August 2026",
  intro:
    "Ishraq Parfums (“we”, “us”) respects your privacy. This policy explains what we collect when you use our website and related services, why we collect it, and the choices you have.",
  sections: [
    {
      id: "who",
      title: "Who we are",
      paragraphs: [
        "Ishraq Parfums is a small-batch perfume house based in India. This website lets you browse ready-made perfumes, complete a bespoke questionnaire, place orders, and manage your account.",
      ],
    },
    {
      id: "collect",
      title: "Information we collect",
      paragraphs: [
        "We collect only what we need to run the shop and serve you:",
      ],
      bullets: [
        "Phone number: used as your account identity and for WhatsApp OTP sign-in",
        "Name and email: when you add them to your profile or checkout",
        "Delivery addresses: when you save or use them for an order",
        "Order and payment records: products, amounts, shipping, and status",
        "Reviews you submit: rating, optional title and body, linked to your account",
        "Bespoke answers and formulas: when you use the questionnaire",
        "Technical basics: cookies for signed-in sessions, and standard server logs",
      ],
    },
    {
      id: "payments",
      title: "Payments",
      paragraphs: [
        "Card and UPI payments are processed by Razorpay. We do not store your full card details on our servers. Razorpay may process payment data under its own privacy terms.",
      ],
    },
    {
      id: "use",
      title: "How we use information",
      paragraphs: ["We use your information to:"],
      bullets: [
        "Authenticate you and keep your session secure",
        "Fulfil and track orders",
        "Respond when you contact us",
        "Show verified-buyer context on reviews where applicable",
        "Improve the product experience (for example, fixing errors)",
      ],
    },
    {
      id: "share",
      title: "Sharing",
      paragraphs: [
        "We do not sell your personal information. We share data only with providers who help us operate the service: payment processing (Razorpay), hosting, and database infrastructure. We share it only as needed for those purposes, or when the law requires it.",
      ],
    },
    {
      id: "retention",
      title: "Retention",
      paragraphs: [
        "We keep account, order, and review data for as long as your account exists and as required for legal, tax, and dispute purposes. You may ask us to update or delete account details that are not required to retain for orders already placed.",
      ],
    },
    {
      id: "rights",
      title: "Your choices",
      paragraphs: [
        "You can update profile and address details in your Account. For access, correction, or deletion requests beyond self-serve tools, contact us using the details on our Contact page.",
      ],
    },
    {
      id: "changes",
      title: "Changes",
      paragraphs: [
        "We may update this policy as the product evolves. The effective date at the top of this page will change when we do. Continued use of the site after an update means you accept the revised policy.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Questions about privacy: use the channels on our Contact page.",
      ],
    },
  ],
};
