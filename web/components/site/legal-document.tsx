import type { LegalDocumentContent } from "@/lib/site/legal-types";

/**
 * Renders structured legal content — no HTML-in-strings, no CMS required.
 * Every section already carried an `id` for anchor scrolling but nothing
 * pointed at it; a table of contents (sticky rail on desktop, a scrollable
 * chip row on mobile) is built straight from `document.sections`, so it can
 * never drift out of sync with the content it lists.
 */
export function LegalDocument({
  document,
}: {
  document: LegalDocumentContent;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
      <nav aria-label="Sections" className="mb-8 -mx-5 overflow-x-auto px-5 lg:hidden">
        <div className="flex gap-2 pb-1">
          {document.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 whitespace-nowrap rounded-full border border-graphite/15 px-3.5 py-1.5 font-ui text-[11px] uppercase tracking-[0.12em] text-graphite-soft transition-colors duration-200 hover:border-terra/40 hover:text-terra"
            >
              {section.title}
            </a>
          ))}
        </div>
      </nav>

      <nav aria-label="Sections" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
            On this page
          </p>
          <ul className="mt-4 space-y-2.5 border-l border-graphite/10">
            {document.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px block border-l-2 border-transparent pl-4 text-[13.5px] leading-snug text-graphite-soft transition-colors duration-200 hover:border-terra/40 hover:text-terra"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="min-w-0 max-w-[62ch]">
        <p className="text-[15.5px] leading-relaxed text-graphite-soft">
          {document.intro}
        </p>

        <div className="mt-10 divide-y divide-graphite/10 border-t border-graphite/10">
          {document.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 py-8 last:pb-0"
            >
              <h2 className="font-editorial text-[21px] leading-snug text-graphite">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${section.id}-p-${index}`}
                    className="text-[15px] leading-relaxed text-graphite-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-graphite-soft marker:text-terra/60">
                  {section.bullets.map((item, index) => (
                    <li key={`${section.id}-b-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
