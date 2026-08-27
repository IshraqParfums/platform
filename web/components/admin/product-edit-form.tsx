"use client";

import type {
  AdminCollectionResponse,
  AdminProductDetail,
  ProductGender,
  ProductScentIntensity,
  ProductScentLongevity,
  ProductScentSillage,
} from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { AdminArchivedCollectionNotice } from "@/components/admin/admin-archived-collection-notice";
import {
  ProductFaqEditor,
  type ProductFaqDraft,
} from "@/components/admin/product-faq-editor";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { urduIfPresent, URDU_FIELD_PROPS } from "@/lib/admin/urdu-field";

// Same parsing conventions as the create form: comma-separated Inputs for
// short lists (notes, tags), one-item-per-line Textareas for longer lists
// (steps, paragraphs). Blank lines/entries are dropped.
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

function joinCommaList(values: string[] | null | undefined): string {
  return (values ?? []).join(", ");
}

function joinLines(values: string[] | null | undefined): string {
  return (values ?? []).join("\n");
}

function buildNoteList(
  notes: string,
  translation: string,
): { notes: string[]; notesTranslation: string[] | null } | null {
  const parsedNotes = parseCommaList(notes);
  if (parsedNotes.length === 0) return null;
  const parsedTranslation = parseCommaList(translation);
  return {
    notes: parsedNotes,
    notesTranslation: parsedTranslation.length > 0 ? parsedTranslation : null,
  };
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

  // --- PDP content, seeded from the current product ---
  const [pronunciation, setPronunciation] = useState(
    product.pronunciation ?? "",
  );
  const [meaning, setMeaning] = useState(product.meaning ?? "");
  const [taglinePrimary, setTaglinePrimary] = useState(
    product.taglinePrimary ?? "",
  );
  const [taglineTranslation, setTaglineTranslation] = useState(
    product.taglineTranslation ?? "",
  );

  const [storyHeading, setStoryHeading] = useState(
    product.meaningStory?.heading ?? "",
  );
  const [storyBody, setStoryBody] = useState(
    joinLines(product.meaningStory?.body),
  );
  const [storyBodyTranslation, setStoryBodyTranslation] = useState(
    joinLines(product.meaningStory?.bodyTranslation),
  );

  const [openingNotes, setOpeningNotes] = useState(
    joinCommaList(product.notesPyramid?.opening?.notes),
  );
  const [openingNotesTranslation, setOpeningNotesTranslation] = useState(
    joinCommaList(product.notesPyramid?.opening?.notesTranslation),
  );
  const [heartNotes, setHeartNotes] = useState(
    joinCommaList(product.notesPyramid?.heart?.notes),
  );
  const [heartNotesTranslation, setHeartNotesTranslation] = useState(
    joinCommaList(product.notesPyramid?.heart?.notesTranslation),
  );
  const [baseNotes, setBaseNotes] = useState(
    joinCommaList(product.notesPyramid?.base?.notes),
  );
  const [baseNotesTranslation, setBaseNotesTranslation] = useState(
    joinCommaList(product.notesPyramid?.base?.notesTranslation),
  );

  const [scentFamily, setScentFamily] = useState(product.scentFamily ?? "");
  const [characterTags, setCharacterTags] = useState(
    joinCommaList(product.characterTags),
  );
  const [season, setSeason] = useState(joinCommaList(product.season));
  const [occasion, setOccasion] = useState(joinCommaList(product.occasion));
  const [intensity, setIntensity] = useState(product.intensity ?? "");
  const [sillage, setSillage] = useState(product.sillage ?? "");
  const [longevity, setLongevity] = useState(product.longevity ?? "");
  const [gender, setGender] = useState(product.gender ?? "");

  const [formatLabel, setFormatLabel] = useState(product.formatLabel ?? "");
  const [concentration, setConcentration] = useState(
    product.concentration ?? "",
  );
  const [application, setApplication] = useState(product.application ?? "");
  const [bottleDescription, setBottleDescription] = useState(
    product.bottleDescription ?? "",
  );

  const [faq, setFaq] = useState<ProductFaqDraft[]>(
    () => product.faq ?? [],
  );

  const [submitting, setSubmitting] = useState(false);

  const selectedCollection = useMemo(
    () => collections.find((c) => c.id === collectionId) ?? null,
    [collections, collectionId],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const urduError =
      urduIfPresent(nameUrdu, "Urdu name") ??
      urduIfPresent(taglineTranslation, "Tagline Urdu") ??
      urduIfPresent(storyBodyTranslation, "Story translation") ??
      urduIfPresent(openingNotesTranslation, "Opening notes Urdu") ??
      urduIfPresent(heartNotesTranslation, "Heart notes Urdu") ??
      urduIfPresent(baseNotesTranslation, "Base notes Urdu");
    if (urduError) {
      toast.error(urduError);
      return;
    }
    setSubmitting(true);
    try {
      // The two/three JSON-shaped fields (meaningStory, notesPyramid) have
      // no "clear" signal in the write type (no null option) — omitted
      // when blank, same as create. Everything else is always sent,
      // including "" / [] , so that's how those get cleared.
      const parsedHeading = storyHeading.trim();
      const parsedBody = parseLines(storyBody);
      const meaningStory =
        parsedHeading || parsedBody.length > 0
          ? {
              heading: parsedHeading,
              body: parsedBody,
              bodyTranslation:
                parseLines(storyBodyTranslation).length > 0
                  ? parseLines(storyBodyTranslation)
                  : null,
            }
          : undefined;

      const openingTier = buildNoteList(openingNotes, openingNotesTranslation);
      const heartTier = buildNoteList(heartNotes, heartNotesTranslation);
      const baseTier = buildNoteList(baseNotes, baseNotesTranslation);
      const notesPyramid =
        openingTier || heartTier || baseTier
          ? { opening: openingTier, heart: heartTier, base: baseTier }
          : undefined;

      const faqList = faq
        .map((row) => ({
          question: row.question.trim(),
          answer: row.answer.trim(),
        }))
        .filter((row) => row.question && row.answer);

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
          pronunciation,
          meaning,
          taglinePrimary,
          taglineTranslation,
          ...(meaningStory ? { meaningStory } : {}),
          ...(notesPyramid ? { notesPyramid } : {}),
          scentFamily,
          characterTags: parseCommaList(characterTags),
          // Enums have no "clear" signal in the write type either (no null
          // option) — an admin can set one but not unset it here once saved.
          ...(intensity
            ? { intensity: intensity as ProductScentIntensity }
            : {}),
          ...(sillage ? { sillage: sillage as ProductScentSillage } : {}),
          ...(longevity
            ? { longevity: longevity as ProductScentLongevity }
            : {}),
          season: parseCommaList(season),
          occasion: parseCommaList(occasion),
          ...(gender ? { gender: gender as ProductGender } : {}),
          formatLabel,
          concentration,
          application,
          bottleDescription,
          faq: faqList,
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Details</h2>
        <div className="mt-3 flex flex-col gap-4">
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
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Identity &amp; tagline
        </h2>
        <p className="mt-1 text-sm text-ink-faint">
          How the name is said and what it means, plus the short line shown
          under it on the product page.
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

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Tagline Urdu (optional)
            </span>
            <Input
              value={taglineTranslation}
              onChange={(event) => setTaglineTranslation(event.target.value)}
              {...URDU_FIELD_PROPS}
              className="text-right"
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

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Body Urdu (optional)
            </span>
            <Textarea
              value={storyBodyTranslation}
              onChange={(event) => setStoryBodyTranslation(event.target.value)}
              {...URDU_FIELD_PROPS}
              className="text-right"
            />
            <span className="text-xs text-ink-faint">
              One paragraph per line, matching the body above. Optional.
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
          <div className="grid gap-4 sm:grid-cols-2">
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
                Opening notes Urdu (optional)
              </span>
              <Input
                value={openingNotesTranslation}
                onChange={(event) =>
                  setOpeningNotesTranslation(event.target.value)
                }
                {...URDU_FIELD_PROPS}
                className="text-right"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                Heart notes Urdu (optional)
              </span>
              <Input
                value={heartNotesTranslation}
                onChange={(event) =>
                  setHeartNotesTranslation(event.target.value)
                }
                {...URDU_FIELD_PROPS}
                className="text-right"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Base notes Urdu (optional)
              </span>
              <Input
                value={baseNotesTranslation}
                onChange={(event) =>
                  setBaseNotesTranslation(event.target.value)
                }
                {...URDU_FIELD_PROPS}
                className="text-right"
              />
            </label>
          </div>
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
