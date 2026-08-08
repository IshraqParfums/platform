import type { AtelierBootstrap, AtelierLoadedAccord } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

import { AtelierTool } from "./AtelierTool";

export const metadata: Metadata = { title: "Atelier" };
export const dynamic = "force-dynamic";

/**
 * Resolved here rather than fetched from the client so there is no effect
 * and no flash. The tool OFFERS an accord rather than loading it — arriving
 * from the library should not silently discard whatever is on the bench. A
 * stale or unknown id degrades to "nothing offered" rather than breaking the
 * page: this call runs after the bootstrap fetch below already established
 * the admin session, so any error here is the accord, not the auth.
 */
async function loadOfferedAccord(id: string | undefined): Promise<AtelierLoadedAccord | null> {
  if (!id) return null;
  try {
    const { data } = await adminAuthFetch<AtelierLoadedAccord>(
      `/admin/bespoke/atelier/accords/${encodeURIComponent(id)}`,
    );
    return data;
  } catch {
    return null;
  }
}

export default async function AtelierPage({
  searchParams,
}: {
  searchParams: Promise<{ accord?: string }>;
}) {
  const [{ accord }, bootstrap] = await Promise.all([
    searchParams,
    adminPageFetch<AtelierBootstrap>("/admin/bespoke/atelier/bootstrap"),
  ]);
  const offered = await loadOfferedAccord(accord);

  return (
    <div className="-mx-5 -my-6 sm:-mx-8 sm:-my-8 md:-mx-10">
      <main className="bg-[#241510] px-6 py-12 text-[#f6ecdc]">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">Atelier</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#f6ecdc]/50">
            Build a formula from the {bootstrap.materials.length}-material palette and watch how it
            behaves over a day on skin. Dosing, curves, warnings, the {bootstrap.constituents.length}
            -molecule chemistry and the {bootstrap.techniqueNotes.length} bench notes all come from the
            palette&rsquo;s own data — the grams here are the grams to weigh.
          </p>
          <AtelierTool
            materials={bootstrap.materials}
            constituents={bootstrap.constituents}
            lexicon={bootstrap.lexicon}
            techniqueNotes={bootstrap.techniqueNotes}
            noteCategories={bootstrap.noteCategories}
            catalogue={bootstrap.catalogue}
            offeredAccord={offered}
          />
        </div>
      </main>
    </div>
  );
}
