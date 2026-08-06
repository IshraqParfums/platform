import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/legal-document";
import { StaticPage } from "@/components/site/static-page";
import { termsContent } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: termsContent.title,
  description: termsContent.description,
};

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Legal"
      title={termsContent.title}
      meta={termsContent.effectiveLabel}
    >
      <LegalDocument document={termsContent} />
    </StaticPage>
  );
}
