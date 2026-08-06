import type { LegalDocumentContent } from "@/lib/site/legal-types";

/**
 * Renders structured legal content — no HTML-in-strings, no CMS required for V1.
 */
export function LegalDocument({
  document,
}: {
  document: LegalDocumentContent;
}) {
  return (
    <div className="space-y-10">
      <p className="text-[15.5px] leading-relaxed text-ink-soft">
        {document.intro}
      </p>

      <div className="space-y-10">
        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={`${section.id}-p-${index}`}
                  className="text-[15px] leading-relaxed text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
                {section.bullets.map((item, index) => (
                  <li key={`${section.id}-b-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
