"use client";

import type {
  AdminCollectionResponse,
  AdminProductDetail,
} from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { AdminArchivedCollectionNotice } from "@/components/admin/admin-archived-collection-notice";
import { adminFetch } from "@/lib/auth/admin-fetch";

export function ProductEditForm({
  product,
  collections,
}: {
  product: AdminProductDetail;
  collections: AdminCollectionResponse[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [nameUrdu, setNameUrdu] = useState(product.nameUrdu ?? "");
  const [collectionId, setCollectionId] = useState(product.collectionId);
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [detailedDescription, setDetailedDescription] = useState(
    product.detailedDescription,
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedCollection = useMemo(
    () => collections.find((c) => c.id === collectionId) ?? null,
    [collections, collectionId],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          // Always sent, including "": that is how the field gets cleared.
          // The API trims and maps empty back to null.
          nameUrdu,
          collectionId,
          shortDescription,
          detailedDescription,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not save product");
      }

      toast.success("Product saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* items-start: collection warning must not push Name down the row */}
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Name
          </span>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Urdu name (optional)
          </span>
          <Input
            value={nameUrdu}
            onChange={(event) => setNameUrdu(event.target.value)}
            dir="rtl"
            lang="ur"
            placeholder="عودِ اشراق"
            maxLength={120}
            className="text-right"
          />
        </label>

        <div className="min-w-0 w-full">
          <Select
            label="Collection"
            labelPlacement="above"
            ariaLabel="Collection"
            value={collectionId}
            options={collections.map((collection) => ({
              value: collection.id,
              label: collection.name,
            }))}
            onChange={setCollectionId}
            className="min-w-0 w-full"
            triggerClassName="w-full"
          />
          {selectedCollection?.status === "ARCHIVED" ? (
            <AdminArchivedCollectionNotice>
              This collection is archived. The product will stay off the shop
              shelf until the collection is restored.
            </AdminArchivedCollectionNotice>
          ) : null}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Short description
        </span>
        <Textarea
          value={shortDescription}
          onChange={(event) => setShortDescription(event.target.value)}
          required
          className="min-h-16"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          Detailed description
        </span>
        <Textarea
          value={detailedDescription}
          onChange={(event) => setDetailedDescription(event.target.value)}
          required
        />
      </label>

      <div>
        <Button
          type="submit"
          variant="emphasis"
          size="md"
          disabled={submitting}
          className="cursor-pointer"
        >
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
