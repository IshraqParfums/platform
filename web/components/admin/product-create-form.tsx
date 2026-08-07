"use client";

import type { AdminCollectionResponse, AdminProductDetail } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { isValidSlug } from "@/lib/admin/slugify";
import { useAutoSlug } from "@/lib/admin/use-auto-slug";

export function ProductCreateForm({
  collections,
}: {
  collections: AdminCollectionResponse[];
}) {
  const router = useRouter();
  const { name, slug, setName, setSlug } = useAutoSlug();
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [shortDescription, setShortDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    "rounded-md border border-ink/15 bg-cream px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-ink/40";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidSlug(slug)) {
      toast.error("Slug must be lowercase kebab-case (e.g. citrus-atelier)");
      return;
    }
    setSubmitting(true);
    try {
      const response = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          collectionId,
          shortDescription,
          detailedDescription,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not create product");
      }

      const product = (await response.json()) as AdminProductDetail;
      toast.success("Product created");
      router.push(`/admin/products/${product.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Name
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Slug
          </span>
          <Input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="citrus-atelier"
            required
          />
          <span className="text-xs text-ink-faint">
            Fills from the name; you can tweak it before creating.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Collection
          </span>
          <select
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className={fieldClass}
            required
          >
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
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
          {submitting ? "Creating…" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
