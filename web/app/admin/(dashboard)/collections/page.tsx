import type { AdminCollectionResponse } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { CollectionsManager } from "@/components/admin/collections-manager";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  const collections = await adminPageFetch<AdminCollectionResponse[]>(
    "/admin/collections",
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Collections</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Archiving a collection archives its products too.
        </p>
      </div>

      <CollectionsManager collections={collections} />
    </div>
  );
}
