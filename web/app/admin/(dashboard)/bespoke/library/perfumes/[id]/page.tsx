import type { LibraryAccordDetail } from "@ishraqparfums/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGalleryPerfumes } from "@/lib/gallery/perfumes";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { NestApiError } from "@/lib/api/errors";

import { FormulaTable } from "../../FormulaTable";
import { IfraNotes } from "../../IfraNotes";
import { ScentPrism } from "../../ScentPrism";

export const dynamic = "force-dynamic";

async function loadAccord(id: string): Promise<LibraryAccordDetail | null> {
  try {
    return await adminPageFetch<LibraryAccordDetail>(`/admin/bespoke/library/accords/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof NestApiError && error.status === 404) return null;
    throw error;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs uppercase tracking-wide text-[#f6ecdc]/50">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/**
 * The admin-only read on a demo perfume: what's in the catalogue's own
 * generated bottle art and copy (tagline, notes, story), and — where a
 * bespoke accord is behind it — the real formula, ingredient-by-ingredient
 * quantities and IFRA notes. No price ladder, no sizes, no "Add to bag":
 * this is a catalogue entry, not a storefront listing.
 *
 * Scaled down from Bespoke's web/app/admin/library/perfumes/[id]/page.tsx,
 * which also rendered the discover pages' BottleFigure/ScentPyramid/
 * PerfumeFacts — none of which exist in this app (there's no /discover
 * here; the interactive read on this catalogue is /gallery). The formula,
 * IFRA, and scent-profile sections — the actual point of this page inside
 * the admin, versus the customer-facing gallery — are ported in full.
 */
export default async function AdminPerfumeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfumes = await getGalleryPerfumes();
  const perfume = perfumes.find((p) => p.id === id);
  if (!perfume) notFound();

  const accord = perfume.accordId ? await loadAccord(perfume.accordId) : null;
  const d = perfume.detail;
  const accent = perfume.theme.accent;

  return (
    <div className="-mx-5 -my-6 sm:-mx-8 sm:-my-8 md:-mx-10">
      <main className="relative flex-1 bg-[#241510] text-[#f6ecdc]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]"
          style={{
            background: `radial-gradient(60% 60% at 50% 0%, ${perfume.theme.aura} 0%, transparent 70%)`,
            opacity: 0.55,
          }}
        />

        <div className="relative mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
          <Link
            href="/admin/bespoke/library"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f6ecdc]/50 transition hover:text-[#f6ecdc]"
          >
            ← Library
          </Link>

          <header className="mt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: accent }}>
              {perfume.collection}
              {d && d.family !== perfume.collection && ` · ${d.family}`}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{perfume.name}</h1>
            <p className="mt-4 max-w-lg text-lg italic leading-relaxed text-[#f6ecdc]/70">{perfume.tagline}</p>
            <p className="mt-6 font-mono text-[12px] tracking-wide text-[#f6ecdc]/45">
              {perfume.concentration}
              {d && ` · ${d.perfumer}, ${d.year}`}
            </p>
          </header>

          <Section title="Notes">
            <div className="flex flex-wrap gap-6 text-sm">
              {(["top", "heart", "base"] as const).map(
                (tier) =>
                  perfume.notes[tier]?.length > 0 && (
                    <div key={tier}>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-[#f6ecdc]/45">{tier}</p>
                      <p className="mt-1 max-w-xs text-[#f6ecdc]/80">{perfume.notes[tier].join(" · ")}</p>
                    </div>
                  ),
              )}
            </div>
          </Section>

          {d && (
            <Section title="The composition">
              <p className="max-w-2xl text-[15px] leading-relaxed text-[#f6ecdc]/75">{d.story}</p>
            </Section>
          )}

          {d && (
            <Section title="What to expect">
              <div className="flex flex-wrap gap-6 text-sm text-[#f6ecdc]/75">
                <p>
                  Longevity: {d.longevity.hours[0]}–{d.longevity.hours[1]}h ({d.longevity.label})
                </p>
                <p>Sillage: {d.sillage.label}</p>
                <p>Wear: {d.wear}</p>
              </div>
              {(d.occasions.length > 0 || d.seasons.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[...d.occasions, ...d.seasons].map((tag) => (
                    <span key={tag} className="rounded-full border border-[#f6ecdc]/20 px-2.5 py-1 text-xs text-[#f6ecdc]/70">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {perfume.profile && (
            <Section title="The shape of it">
              <ScentPrism vector={perfume.profile} />
            </Section>
          )}

          {accord ? (
            <>
              <Section title="Ingredient breakdown & quantities">
                <p className="text-sm text-[#f6ecdc]/60">
                  Neat percentages, plus dual-column dosing at a {accord.batchGReference}g reference batch — today,
                  against current bench dilutions, and later, once neat material arrives. This is the real formula
                  behind the bottle, not the marketing notes above.
                </p>
                <FormulaTable accord={accord} />
              </Section>

              <Section title="IFRA restriction notes">
                <IfraNotes notes={accord.ifraNotes} />
              </Section>
            </>
          ) : (
            <Section title="Ingredient breakdown & quantities">
              <p className="text-sm text-[#f6ecdc]/50">
                No formula authored for this perfume yet — nothing to show rather than a guess.
              </p>
            </Section>
          )}

          {d?.similarTo?.length ? (
            <Section title="If you like">
              <div className="flex flex-wrap gap-2">
                {d.similarTo.map((item) => (
                  <span key={item} className="rounded-full border border-[#f6ecdc]/20 px-2.5 py-1 text-xs text-[#f6ecdc]/70">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#f6ecdc]/45">
                Named for orientation, not comparison — these are well-known scents in the same territory.
              </p>
            </Section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
