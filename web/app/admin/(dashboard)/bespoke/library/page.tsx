import type { LibraryAccordSummary } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { getGalleryPerfumes } from "@/lib/gallery/perfumes";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

import { LibraryBrowser } from "./LibraryBrowser";

export const metadata: Metadata = { title: "Library" };
export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  const [perfumes, accords] = await Promise.all([
    getGalleryPerfumes(),
    adminPageFetch<LibraryAccordSummary[]>("/admin/bespoke/library/accords"),
  ]);

  const perfumeSummaries = perfumes.map((p) => ({
    id: p.id,
    name: p.name,
    collection: p.collection,
    tagline: p.tagline,
    family: p.detail?.family ?? p.collection,
    profile: p.profile ?? null,
  }));

  return (
    <div className="-mx-5 -my-6 sm:-mx-8 sm:-my-8 md:-mx-10">
      <main className="bg-[#241510] px-6 py-12 text-[#f6ecdc]">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">Library</h1>
          <p className="mt-1 text-sm text-[#f6ecdc]/50">
            {perfumeSummaries.length.toLocaleString()} demo perfumes · {accords.length.toLocaleString()} bespoke accords
          </p>
          <LibraryBrowser perfumes={perfumeSummaries} accords={accords} />
        </div>
      </main>
    </div>
  );
}
