import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/legal-document";
import { StaticPage } from "@/components/site/static-page";
import { privacyContent } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: privacyContent.title,
  description: privacyContent.description,
};

export default function PrivacyPage() {
  return (
    <StaticPage
      kicker="Legal"
      title={privacyContent.title}
      meta={privacyContent.effectiveLabel}
    >
      <LegalDocument document={privacyContent} />
    </StaticPage>
  );
}
