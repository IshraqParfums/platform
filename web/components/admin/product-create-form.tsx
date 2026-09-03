"use client";

import type {
  AdminCollectionResponse,
  AdminProductDetail,
  AdminProductImage,
  AdminProductVariant,
  ProductGender,
  ProductScentIntensity,
  ProductScentLongevity,
  ProductScentSillage,
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
import {
  ProductFaqEditor,
  type ProductFaqDraft,
} from "@/components/admin/product-faq-editor";
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
import { urduIfPresent } from "@/lib/admin/urdu-field";
import { useAutoSlug } from "@/lib/admin/use-auto-slug";
import { adminFetch } from "@/lib/auth/admin-fetch";

// Parsing conventions for the PDP content fields below: comma-separated
// Inputs for short lists (notes, tags), one-item-per-line Textareas for
// longer lists (steps, paragraphs). Blank lines/entries are dropped.
function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function buildNoteList(notes: string): { notes: string[] } | null {
  const parsedNotes = parseCommaList(notes);
  if (parsedNotes.length === 0) return null;
  return { notes: parsedNotes };
}

const INTENSITY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "LIGHT", label: "Light" },
  { value: "MODERATE", label: "Moderate" },
  { value: "STRONG", label: "Strong" },
];

const SILLAGE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "INTIMATE", label: "Intimate" },
  { value: "MODERATE", label: "Moderate" },
  { value: "STRONG", label: "Strong" },
];

const LONGEVITY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "SHORT", label: "Short" },
  { value: "MODERATE", label: "Moderate" },
  { value: "LONG", label: "Long" },
  { value: "VERY_LONG", label: "Very long" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "UNISEX", label: "Unisex" },
  { value: "FEMININE", label: "Feminine" },
  { value: "MASCULINE", label: "Masculine" },
];

export function ProductCreateForm({
  collections,
}: {
  collections: AdminCollectionResponse[];
}) {
  const router = useRouter();
  const { name, slug, setName, setSlug } = useAutoSlug();
  const [nameUrdu, setNameUrdu] = useState("");
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [shortDescription, setShortDescription] = useState("");

  // --- PDP content (all optional, progressively authored) ---
  const [pronunciation, setPronunciation] = useState("");
  const [meaning, setMeaning] = useState("");
  const [taglinePrimary, setTaglinePrimary] = useState("");

  const [storyHeading, setStoryHeading] = useState("");
  const [storyBody, setStoryBody] = useState("");

  const [openingNotes, setOpeningNotes] = useState("");
  const [heartNotes, setHeartNotes] = useState("");
  const [baseNotes, setBaseNotes] = useState("");

  const [scentFamily, setScentFamily] = useState("");
  const [characterTags, setCharacterTags] = useState("");
  const [season, setSeason] = useState("");
  const [occasion, setOccasion] = useState("");
  const [intensity, setIntensity] = useState("");
  const [sillage, setSillage] = useState("");
  const [longevity, setLongevity] = useState("");
  const [gender, setGender] = useState("");

  const [formatLabel, setFormatLabel] = useState("");
  const [concentration, setConcentration] = useState("");
  const [application, setApplication] = useState("");
  const [bottleDescription, setBottleDescription] = useState("");

  const [faq, setFaq] = useState<ProductFaqDraft[]>([]);

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
      sizes,
      imageCount: imageDrafts.length,
    }),
    [
      name,
      slug,
      collectionId,
      collectionArchived,
      shortDescription,
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

    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    if (!trimmedShort) {
      toast.error("Short description is required");
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

    const urduError = urduIfPresent(nameUrdu, "Urdu name");
    if (urduError) {
      toast.error(urduError);
      return;
    }

    const releaseNow = intent === "release";

    if (!releaseNow && !draftReady) {
      toast.error("Fill name, slug, collection, and short description");
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

    // PDP content fields, all optional: omitted from the payload rather
    // than sent blank, matching the nameUrdu precedent above — a blank
    // field on create should never write a row the storefront then has to
    // null-check twice.
    const parsedHeading = storyHeading.trim();
    const parsedBody = parseLines(storyBody);
    const meaningStory =
      parsedHeading || parsedBody.length > 0
        ? { heading: parsedHeading, body: parsedBody }
        : undefined;

    const openingTier = buildNoteList(openingNotes);
    const heartTier = buildNoteList(heartNotes);
    const baseTier = buildNoteList(baseNotes);
    const notesPyramid =
      openingTier || heartTier || baseTier
        ? { opening: openingTier, heart: heartTier, base: baseTier }
        : undefined;

    const characterTagsList = parseCommaList(characterTags);
    const seasonList = parseCommaList(season);
    const occasionList = parseCommaList(occasion);
    const faqList = faq
      .map((row) => ({ question: row.question.trim(), answer: row.answer.trim() }))
      .filter((row) => row.question && row.answer);

    setSubmitting(true);
    setActiveIntent(intent);
    let createdProductId: string | null = null;

    try {
      const createResponse = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          // Optional. Omitted rather than sent empty so a blank field never
          // writes a row the storefront then has to null-check twice.
          ...(nameUrdu.trim() ? { nameUrdu: nameUrdu.trim() } : {}),
          slug,
          collectionId,
          shortDescription: trimmedShort,
          status: "DRAFT" satisfies ProductStatus,
          ...(pronunciation.trim()
            ? { pronunciation: pronunciation.trim() }
            : {}),
          ...(meaning.trim() ? { meaning: meaning.trim() } : {}),
          ...(taglinePrimary.trim()
            ? { taglinePrimary: taglinePrimary.trim() }
            : {}),
          ...(meaningStory ? { meaningStory } : {}),
          ...(notesPyramid ? { notesPyramid } : {}),
          ...(scentFamily.trim() ? { scentFamily: scentFamily.trim() } : {}),
          ...(characterTagsList.length > 0
            ? { characterTags: characterTagsList }
            : {}),
          ...(intensity
            ? { intensity: intensity as ProductScentIntensity }
            : {}),
          ...(sillage ? { sillage: sillage as ProductScentSillage } : {}),
          ...(longevity
            ? { longevity: longevity as ProductScentLongevity }
            : {}),
          ...(seasonList.length > 0 ? { season: seasonList } : {}),
          ...(occasionList.length > 0 ? { occasion: occasionList } : {}),
          ...(gender ? { gender: gender as ProductGender } : {}),
          ...(formatLabel.trim() ? { formatLabel: formatLabel.trim() } : {}),
          ...(concentration.trim()
            ? { concentration: concentration.trim() }
            : {}),
          ...(application.trim() ? { application: application.trim() } : {}),
          ...(bottleDescription.trim()
            ? { bottleDescription: bottleDescription.trim() }
            : {}),
          ...(faqList.length > 0 ? { faq: faqList } : {}),
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

            <label className="flex flex-col gap-1.5 sm:col-span-2">
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
              <span className="text-xs text-ink-faint">
                Shown beside the English name on the storefront. Leave blank to
                hide it.
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
        <h2 className="font-display text-lg font-semibold text-ink">
          Identity &amp; tagline
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          How the name is said and what it means, plus the short line shown
          under it on the product page. All optional.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Pronunciation
            </span>
            <Input
              value={pronunciation}
              onChange={(event) => setPronunciation(event.target.value)}
              placeholder="oo-d ish-raak"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Meaning
            </span>
            <Input
              value={meaning}
              onChange={(event) => setMeaning(event.target.value)}
              placeholder="The radiance of oud"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Tagline
            </span>
            <Input
              value={taglinePrimary}
              onChange={(event) => setTaglinePrimary(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          The story
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          What the name means, told in a few short paragraphs.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Heading
            </span>
            <Input
              value={storyHeading}
              onChange={(event) => setStoryHeading(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Body
            </span>
            <Textarea
              value={storyBody}
              onChange={(event) => setStoryBody(event.target.value)}
            />
            <span className="text-xs text-ink-faint">
              One paragraph per line.
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Notes pyramid
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          The fragrance&apos;s opening, heart, and base notes. Comma-separated.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Opening notes
            </span>
            <Input
              value={openingNotes}
              onChange={(event) => setOpeningNotes(event.target.value)}
              placeholder="Bergamot, Pink pepper"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Heart notes
            </span>
            <Input
              value={heartNotes}
              onChange={(event) => setHeartNotes(event.target.value)}
              placeholder="Rose, Saffron"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Base notes
            </span>
            <Input
              value={baseNotes}
              onChange={(event) => setBaseNotes(event.target.value)}
              placeholder="Oud, Amber"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Scent profile
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          Family, character, and the metadata used for storefront chips and
          filtering.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Family
            </span>
            <Input
              value={scentFamily}
              onChange={(event) => setScentFamily(event.target.value)}
              placeholder="Woody amber"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Character tags
              </span>
              <Input
                value={characterTags}
                onChange={(event) => setCharacterTags(event.target.value)}
                placeholder="Inky, Powdery, Dry"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Season
              </span>
              <Input
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                placeholder="Winter, Autumn"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Occasion
              </span>
              <Input
                value={occasion}
                onChange={(event) => setOccasion(event.target.value)}
                placeholder="Evening, Formal"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Intensity"
              labelPlacement="above"
              ariaLabel="Intensity"
              value={intensity}
              options={INTENSITY_OPTIONS}
              onChange={setIntensity}
              className="w-full"
              triggerClassName="w-full"
            />
            <Select
              label="Sillage"
              labelPlacement="above"
              ariaLabel="Sillage"
              value={sillage}
              options={SILLAGE_OPTIONS}
              onChange={setSillage}
              className="w-full"
              triggerClassName="w-full"
            />
            <Select
              label="Longevity"
              labelPlacement="above"
              ariaLabel="Longevity"
              value={longevity}
              options={LONGEVITY_OPTIONS}
              onChange={setLongevity}
              className="w-full"
              triggerClassName="w-full"
            />
            <Select
              label="Gender"
              labelPlacement="above"
              ariaLabel="Gender"
              value={gender}
              options={GENDER_OPTIONS}
              onChange={setGender}
              className="w-full"
              triggerClassName="w-full"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Format
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          Bottle and concentration details shown in the format section of the
          product page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Format label
            </span>
            <Input
              value={formatLabel}
              onChange={(event) => setFormatLabel(event.target.value)}
              placeholder="Eau de Parfum"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Concentration
            </span>
            <Input
              value={concentration}
              onChange={(event) => setConcentration(event.target.value)}
              placeholder="20% oil"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Application
            </span>
            <Input
              value={application}
              onChange={(event) => setApplication(event.target.value)}
              placeholder="Spray"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Bottle description
            </span>
            <Input
              value={bottleDescription}
              onChange={(event) => setBottleDescription(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">FAQ</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Question and answer pairs shown at the bottom of the product page.
        </p>
        <div className="mt-4">
          <ProductFaqEditor value={faq} onChange={setFaq} />
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
