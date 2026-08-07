"use client";

import type { AdminCollectionResponse } from "@ishraqparfums/shared";
import { useState, type ReactNode } from "react";
import { AdminSlugReadonly } from "@/components/admin/admin-slug-readonly";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { isValidSlug } from "@/lib/admin/slugify";
import { useAutoSlug } from "@/lib/admin/use-auto-slug";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CollectionFormModal({
  collection,
  open,
  onClose,
  onSaved,
}: {
  collection?: AdminCollectionResponse;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(collection);
  const autoSlug = useAutoSlug(
    collection?.name ?? "",
    collection?.slug ?? "",
  );
  const [editName, setEditName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [editorialLabel, setEditorialLabel] = useState(
    collection?.editorialLabel ?? "",
  );
  const [homeRank, setHomeRank] = useState(
    collection?.homeRank != null ? String(collection.homeRank) : "",
  );
  const [submitting, setSubmitting] = useState(false);

  const name = isEdit ? editName : autoSlug.name;
  const slug = isEdit ? (collection?.slug ?? "") : autoSlug.slug;

  async function submit() {
    if (!isEdit && !isValidSlug(slug)) {
      toast.error("Slug must be lowercase kebab-case (e.g. limited-edition)");
      return;
    }
    setSubmitting(true);
    try {
      const path = isEdit
        ? `/api/admin/collections/${collection!.id}`
        : "/api/admin/collections";
      const body = isEdit
        ? {
            name,
            description: description || null,
            editorialLabel: editorialLabel || null,
            homeRank: homeRank ? Number(homeRank) : null,
          }
        : {
            name,
            slug,
            description: description || undefined,
            editorialLabel: editorialLabel || undefined,
          };

      const response = await adminFetch(path, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(responseBody?.message ?? "Could not save collection");
      }

      toast.success(isEdit ? "Collection updated" : "Collection created");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit collection" : "New collection"}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="emphasis"
            size="md"
            disabled={submitting}
            className="cursor-pointer"
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={submitting}
            className="cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input
            value={name}
            onChange={(event) =>
              isEdit
                ? setEditName(event.target.value)
                : autoSlug.setName(event.target.value)
            }
            required
          />
        </Field>
        {isEdit ? (
          <AdminSlugReadonly slug={slug} />
        ) : (
          <Field label="Slug">
            <Input
              value={slug}
              onChange={(event) => autoSlug.setSlug(event.target.value)}
              placeholder="limited-edition"
              required
            />
            <span className="text-xs text-ink-faint">
              Fills from the name; you can tweak it before creating.
            </span>
          </Field>
        )}
        <Field label="Editorial label">
          <Input
            value={editorialLabel}
            onChange={(event) => setEditorialLabel(event.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional"
            className="min-h-16"
          />
        </Field>
        {isEdit ? (
          <Field label="Homepage rank">
            <Input
              type="number"
              min={1}
              value={homeRank}
              onChange={(event) => setHomeRank(event.target.value)}
              placeholder="Not shown on homepage"
            />
          </Field>
        ) : null}
      </div>
    </Modal>
  );
}
