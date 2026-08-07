"use client";

import type {
  AdminCollectionResponse,
  AdminProductDetail,
} from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminSlugReadonly } from "@/components/admin/admin-slug-readonly";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";

const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED", "DELETED"] as const;

export function ProductEditForm({
  product,
  collections,
}: {
  product: AdminProductDetail;
  collections: AdminCollectionResponse[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [collectionId, setCollectionId] = useState(product.collectionId);
  const [status, setStatus] = useState(product.status);
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [detailedDescription, setDetailedDescription] = useState(
    product.detailedDescription,
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          collectionId,
          status,
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

  const fieldClass =
    "rounded-md border border-ink/15 bg-cream px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-ink/40";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Name
          </span>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <AdminSlugReadonly slug={product.slug} />

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Collection
          </span>
          <select
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className={fieldClass}
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Status
          </span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdminProductDetail["status"])
            }
            className={fieldClass}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
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
