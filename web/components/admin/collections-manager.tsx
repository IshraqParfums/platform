"use client";

import type {
  AdminCollectionResponse,
  ArchiveCollectionResponse,
  RestoreCollectionResponse,
} from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CollectionFormModal } from "@/components/admin/collection-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";

export function CollectionsManager({
  collections,
}: {
  collections: AdminCollectionResponse[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminCollectionResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [archiveTarget, setArchiveTarget] =
    useState<AdminCollectionResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  function refresh() {
    router.refresh();
  }

  useEffect(() => {
    if (!archiveTarget) {
      setCartCount(null);
      return;
    }

    let cancelled = false;
    setCartLoading(true);
    setCartCount(null);

    void (async () => {
      try {
        const response = await adminFetch(
          `/api/admin/collections/${archiveTarget.id}/cart-impact`,
        );
        if (!response.ok) throw new Error("Could not load cart impact");
        const data = (await response.json()) as { cartCount: number };
        if (!cancelled) setCartCount(data.cartCount);
      } catch {
        if (!cancelled) setCartCount(null);
      } finally {
        if (!cancelled) setCartLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [archiveTarget]);

  async function confirmArchive() {
    if (!archiveTarget) return;
    setBusyId(archiveTarget.id);
    try {
      const response = await adminFetch(
        `/api/admin/collections/${archiveTarget.id}/archive`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Could not archive collection");
      const data = (await response.json()) as ArchiveCollectionResponse;
      toast.success(
        `Archived "${archiveTarget.name}"${
          data.cascadedProductCount > 0
            ? ` — ${data.cascadedProductCount} product(s) archived too`
            : ""
        }`,
      );
      setArchiveTarget(null);
      refresh();
    } catch {
      toast.error("Could not archive collection");
    } finally {
      setBusyId(null);
    }
  }

  async function restore(collection: AdminCollectionResponse) {
    setBusyId(collection.id);
    try {
      const response = await adminFetch(
        `/api/admin/collections/${collection.id}/restore`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Could not restore collection");
      const data = (await response.json()) as RestoreCollectionResponse;
      toast.success(
        `Restored "${collection.name}"${
          data.restoredProductCount > 0
            ? ` — ${data.restoredProductCount} product(s) restored too`
            : ""
        }`,
      );
      refresh();
    } catch {
      toast.error("Could not restore collection");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">{collections.length} total.</p>
        <Button
          type="button"
          variant="emphasis"
          size="md"
          className="cursor-pointer"
          onClick={() => setCreating(true)}
        >
          New collection
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] text-ink-faint">
              <th className="px-4 py-3 font-mono text-label-sm uppercase">Name</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase">Status</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase">Products</th>
              <th className="px-4 py-3 font-mono text-label-sm uppercase">Home rank</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">
                  No collections yet.
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="border-b border-ink/[0.06] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{collection.name}</p>
                    <p className="text-xs text-ink-faint">{collection.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={collection.status === "ACTIVE" ? "sage" : "neutral"}>
                      {collection.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink">{collection.productCount}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {collection.homeRank ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setEditing(collection)}
                      >
                        Edit
                      </Button>
                      {collection.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyId === collection.id}
                          className="cursor-pointer"
                          onClick={() => setArchiveTarget(collection)}
                        >
                          Archive
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyId === collection.id}
                          className="cursor-pointer"
                          onClick={() => void restore(collection)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <CollectionFormModal
          collection={editing}
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      ) : null}

      <CollectionFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={refresh}
      />

      <Modal
        open={archiveTarget !== null}
        title="Archive collection"
        onClose={() => {
          if (!busyId) setArchiveTarget(null);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={Boolean(busyId)}
              onClick={() => setArchiveTarget(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={Boolean(busyId)}
              onClick={() => void confirmArchive()}
              className="cursor-pointer"
            >
              {busyId ? "Archiving…" : "Archive"}
            </Button>
          </div>
        }
      >
        {archiveTarget ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">
              Archive{" "}
              <span className="font-medium text-ink">{archiveTarget.name}</span>?
              Its products will be archived too.
            </p>
            {cartLoading ? (
              <p className="text-sm text-ink-faint">Checking customer carts…</p>
            ) : cartCount != null ? (
              <p className="text-sm text-ink-soft">
                In{" "}
                <span className="font-medium text-ink">{cartCount}</span> customer{" "}
                {cartCount === 1 ? "cart" : "carts"} right now.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
