import type { LibraryAccordDetail } from "@ishraqparfums/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function AdminAccordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accord = await loadAccord(id);
  if (!accord) notFound();

  return (
    <div className="-mx-5 -my-6 sm:-mx-8 sm:-my-8 md:-mx-10">
      <main className="flex-1 bg-[#241510] px-6 py-16 text-[#f6ecdc]">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin/bespoke/library" className="text-xs uppercase tracking-wide text-[#f6ecdc]/50 hover:text-[#f6ecdc]">
              ← Library
            </Link>
            {/*
              The Atelier can already search all 1,081 accords and load one, but
              only from inside the Atelier. Browsing to an accord here and having
              no way to take it to the bench was the wrong way round: this is
              where you decide you want to work on something.
            */}
            <Link
              href={`/admin/bespoke/atelier?accord=${accord.id}`}
              className="rounded-full border border-[#c9963e]/40 px-4 py-1.5 text-xs uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
            >
              Open at the bench →
            </Link>
          </div>

          <header className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9963e]">
              {accord.primaryFamily ?? "—"}
              {accord.secondaryFamily ? ` · ${accord.secondaryFamily}` : ""}
              {accord.composite ? " · composite" : ""}
            </p>
            <h1 className="mt-2 text-4xl font-semibold">{accord.name}</h1>
            <p className="mt-1 italic text-[#f6ecdc]/60">{accord.inspiration}</p>
            <p className="mt-3 text-sm text-[#f6ecdc]/50">
              Source: {accord.source.nodeId ?? "classic reference"}
              {accord.source.optionId ? ` / ${accord.source.optionId}` : ""} · layer: {accord.source.layer ?? "unknown"}
            </p>
          </header>

          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-wide text-[#f6ecdc]/50">Scent profile</h2>
            <div className="mt-2">
              <ScentPrism vector={accord.vector} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(accord.modifiers.patina !== 0 || accord.modifiers.moisture !== 0) && (
                <>
                  {accord.modifiers.patina !== 0 && (
                    <span className="rounded-full border border-[#c9963e]/40 px-3 py-1 text-xs text-[#c9963e]">
                      patina: {accord.modifiers.patina}
                    </span>
                  )}
                  {accord.modifiers.moisture !== 0 && (
                    <span className="rounded-full border border-[#c9963e]/40 px-3 py-1 text-xs text-[#c9963e]">
                      moisture: {accord.modifiers.moisture}
                    </span>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-wide text-[#f6ecdc]/50">Note to perfumer</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[#f6ecdc]/85">{accord.noteToPerfumer}</p>
            <FormulaTable accord={accord} />
          </section>

          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-wide text-[#f6ecdc]/50">IFRA restriction notes</h2>
            <IfraNotes notes={accord.ifraNotes} />
          </section>

          <section className="mt-8 flex flex-wrap gap-6 text-sm text-[#f6ecdc]/70">
            <p>Neat load: {accord.neatLoadPct}%</p>
            <p>Attar safe: {accord.attarSafe ? "yes" : "no"}</p>
            <p>Batch reference: {accord.batchGReference}g</p>
          </section>
        </div>
      </main>
    </div>
  );
}
