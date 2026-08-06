/**
 * Structured legal / static document sections.
 * Content stays in data modules; rendering stays in LegalDocument.
 */
export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  /** Optional bullet list under the paragraphs. */
  bullets?: string[];
};

export type LegalDocumentContent = {
  slug: "privacy" | "terms";
  title: string;
  description: string;
  /** Shown under the title — e.g. effective date. */
  effectiveLabel: string;
  intro: string;
  sections: LegalSection[];
};
