"use client";

import type {
  AdminCollectionResponse,
  AdminProductDetail,
  AdminProductImage,
  AdminProductVariant,
  ProductStatus,
} from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ProductCreateActions,
  type ProductCreateSubmitIntent,
} from "@/components/admin/product-create/create-actions";
import {
  ProductCreateImagePicker,
  type ProductCreateImageDraft,
} from "@/components/admin/product-create/image-picker";
import { ProductCreateSizePills } from "@/components/admin/product-create/size-pills";
import { AdminArchivedCollectionNotice } from "@/components/admin/admin-archived-collection-notice";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { readAdminResponseError } from "@/lib/admin/admin-error-message";
import {
  canReleaseProductCreate,
  canSaveProductDraft,
  collectCompleteCreateSizeDrafts,
  emptyCreateSizeDraftMap,
  getProductCreateDraftBlockers,
  getProductCreateReleaseBlockers,
  validateProductImageFile,
  type CatalogSizeMl,
  type CreateSizeDraft,
  type CreateSizeDraftMap,
} from "@/lib/admin/product-create";
import { isValidSlug } from "@/lib/admin/slugify";
import { useAutoSlug } from "@/lib/admin/use-auto-slug";
import { adminFetch } from "@/lib/auth/admin-fetch";

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
  const [sizes, setSizes] = useState<CreateSizeDraftMap>(() =>
    emptyCreateSizeDraftMap(),
  );
  const [imageDrafts, setImageDrafts] = useState<ProductCreateImageDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeIntent, setActiveIntent] =
    useState<ProductCreateSubmitIntent | null>(null);

  const selectedCollection = useMemo(
    () => collections.find((c) => c.id === collectionId) ?? null,
    [collections, collectionId],
  );

  const collectionArchived = selectedCollection?.status === "ARCHIVED";

  const readinessInput = useMemo(
    () => ({
      name,
      slug,
      collectionId,
      collectionArchived,
      shortDescription,
      detailedDescription,
      sizes,
      imageCount: imageDrafts.length,
    }),
    [
      name,
      slug,
      collectionId,
      collectionArchived,
      shortDescription,
      detailedDescription,
      sizes,
      imageDrafts.length,
    ],
  );

  const releaseBlockers = useMemo(
    () => getProductCreateReleaseBlockers(readinessInput),
    [readinessInput],
  );
  const draftBlockers = useMemo(
    () => getProductCreateDraftBlockers(readinessInput),
    [readinessInput],
  );
  const draftReady = canSaveProductDraft(readinessInput);
  const releaseReady = canReleaseProductCreate(readinessInput);

  useEffect(() => {
    return () => {
      for (const image of imageDrafts) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
    // Only revoke on unmount — drafts hold live object URLs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchSize(sizeMl: CatalogSizeMl, patch: Partial<CreateSizeDraft>) {
    setSizes((prev) => ({
      ...prev,
      [sizeMl]: { ...prev[sizeMl], ...patch },
    }));
  }

  function appendImages(files: File[]) {
    const accepted: ProductCreateImageDraft[] = [];
    for (const file of files) {
      const check = validateProductImageFile(file);
      if (!check.ok) {
        toast.error(check.reason);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: "",
      });
    }
    if (accepted.length === 0) return;
    setImageDrafts((prev) => [...prev, ...accepted]);
  }

  function removeImage(id: string) {
    setImageDrafts((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  }

  function patchImageAlt(id: string, altText: string) {
    setImageDrafts((prev) =>
      prev.map((image) => (image.id === id ? { ...image, altText } : image)),
    );
  }

  async function submit(intent: ProductCreateSubmitIntent) {
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedShort = shortDescription.trim();
    const trimmedDetailed = detailedDescription.trim();

    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    if (!trimmedShort) {
      toast.error("Short description is required");
      return;
    }
    if (!trimmedDetailed) {
      toast.error("Detailed description is required");
      return;
    }
    if (!collectionId) {
      toast.error("Choose a collection");
      return;
    }
    if (!isValidSlug(slug)) {
      toast.error("Slug must be lowercase kebab-case (e.g. citrus-atelier)");
      return;
    }

    const releaseNow = intent === "release";

    if (!releaseNow && !draftReady) {
      toast.error("Fill name, slug, collection, and both descriptions");
      return;
    }

    if (releaseNow && !releaseReady) {
      toast.error("Finish the release checklist before creating & releasing");
      return;
    }

    // Incomplete enabled size pills are skipped — only fully parsed sizes go up.
    const variantBodies = collectCompleteCreateSizeDrafts(sizes);

    if (releaseNow && !variantBodies.some((v) => v.stockQty > 0)) {
      toast.error(
        "Release requires at least one size with stock greater than 0",
      );
      return;
    }

    if (releaseNow && imageDrafts.length < 1) {
      toast.error("Release requires at least one image");
      return;
    }

    setSubmitting(true);
    setActiveIntent(intent);
    let createdProductId: string | null = null;

    try {
      const createResponse = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          slug,
          collectionId,
          shortDescription: trimmedShort,
          detailedDescription: trimmedDetailed,
          status: "DRAFT" satisfies ProductStatus,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(
          await readAdminResponseError(
            createResponse,
            "Could not create product",
          ),
        );
      }

      const product = (await createResponse.json()) as AdminProductDetail;
      createdProductId = product.id;

      for (const body of variantBodies) {
        const variantResponse = await adminFetch(
          `/api/admin/products/${product.id}/variants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sizeMl: body.sizeMl,
              pricePaise: body.pricePaise,
              compareAtPricePaise: body.compareAtPricePaise ?? undefined,
              stockQty: body.stockQty,
            }),
          },
        );
        if (!variantResponse.ok) {
          throw new Error(
            await readAdminResponseError(
              variantResponse,
              `Could not create ${body.sizeMl} ml variant`,
            ),
          );
        }
        await variantResponse
          .json()
          .catch(() => null as AdminProductVariant | null);
      }

      for (let i = 0; i < imageDrafts.length; i++) {
        const draft = imageDrafts[i]!;
        const formData = new FormData();
        formData.append("file", draft.file);
        formData.append("displayOrder", String(i));
        const trimmedAlt = draft.altText.trim();
        if (trimmedAlt) {
          formData.append("altText", trimmedAlt);
        }
        const imageResponse = await adminFetch(
          `/api/admin/products/${product.id}/images`,
          { method: "POST", body: formData },
        );
        if (!imageResponse.ok) {
          throw new Error(
            await readAdminResponseError(
              imageResponse,
              `Could not upload ${draft.file.name}`,
            ),
          );
        }
        await imageResponse.json().catch(() => null as AdminProductImage | null);
      }

      if (releaseNow) {
        if (collectionArchived) {
          const parkResponse = await adminFetch(
            `/api/admin/products/${product.id}/park-in-archived-collection`,
            { method: "POST" },
          );
          if (!parkResponse.ok) {
            const message = await readAdminResponseError(
              parkResponse,
              "Product saved as draft, but could not park for the archived collection. Finish on the edit page.",
            );
            toast.error(message);
            router.push(`/admin/products/${product.id}`);
            return;
          }
        } else {
          const activateResponse = await adminFetch(
            `/api/admin/products/${product.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "ACTIVE" }),
            },
          );
          if (!activateResponse.ok) {
            const message = await readAdminResponseError(
              activateResponse,
              "Product saved as draft, but could not activate. Finish sizes and images on the edit page, then activate.",
            );
            toast.error(message);
            router.push(`/admin/products/${product.id}`);
            return;
          }
        }
      }

      toast.success(
        releaseNow
          ? collectionArchived
            ? "Product ready — parked until the collection is restored"
            : "Product created and released"
          : "Draft saved",
      );
      router.push(`/admin/products/${product.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);

      if (createdProductId) {
        router.push(`/admin/products/${createdProductId}`);
        return;
      }

      setSubmitting(false);
      setActiveIntent(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Details</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Required for both draft and release.
        </p>
        <div className="mt-4 flex flex-col gap-4">
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

            <div className="sm:col-span-2">
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
                className="w-full sm:max-w-md"
                triggerClassName="w-full"
              />
              {collectionArchived ? (
                <AdminArchivedCollectionNotice>
                  This collection is archived. Create &amp; release will park the
                  product until you restore the collection — it won&apos;t appear
                  in the shop until then.
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
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Sizes</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Catalog sizes are 30, 50, and 100&nbsp;ml. Select at least one with
          price and stock to release — optional for a draft. Custom sizes can be
          added later on the edit page.
        </p>
        <div className="mt-4">
          <ProductCreateSizePills sizes={sizes} onChange={patchSize} />
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Images</h2>
        <p className="mt-1 text-sm text-ink-faint">
          At least one photo is required to release — optional for a draft.
          First image is primary. Alt text and order stay on the draft until you
          save.
        </p>
        <div className="mt-4">
          <ProductCreateImagePicker
            images={imageDrafts}
            onAppend={appendImages}
            onRemove={removeImage}
            onAltChange={patchImageAlt}
            onReorder={setImageDrafts}
          />
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Save</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Save a draft anytime details are filled. Incomplete size pills are
          skipped. Create &amp; release unlocks when the checklist below is clear.
        </p>
        <div className="mt-4">
          <ProductCreateActions
            draftBlockers={draftBlockers}
            releaseBlockers={releaseBlockers}
            canSaveDraft={draftReady}
            canRelease={releaseReady}
            collectionArchived={collectionArchived}
            submitting={submitting}
            activeIntent={activeIntent}
            onSubmit={(intent) => void submit(intent)}
          />
        </div>
      </div>
    </div>
  );
}
