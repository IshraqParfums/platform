import type {
  ProductNoteList,
  ProductNotesPyramid,
} from "@ishraqparfums/shared";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { RecordSection } from "@/components/product-v2/ui/record";

const TIERS = [
  { key: "opening", label: "Opening" },
  { key: "heart", label: "Heart" },
  { key: "base", label: "Base" },
] as const;

/**
 * The notes, as a readable list.
 *
 * A previous pass set these as display-scale stanzas at
 * `clamp(23px…34px)` — it looked composed, but it turned three short lines
 * into a full screen of scrolling and read as a poem rather than as the
 * information people came for. Back to a compact list at body/h4 scale, in
 * `text-graphite` so it can actually be read.
 *
 * The support line does the explaining that "Opening / Heart / Base" doesn't
 * for anyone outside perfumery. Character and family moved out to "How it
 * smells", which now comes before this.
 */
export function ProductNotesChapter({
  notesPyramid,
}: {
  notesPyramid: ProductNotesPyramid | null;
}) {
  const tiers = TIERS.flatMap(({ key, label }) => {
    const list: ProductNoteList | null = notesPyramid?.[key] ?? null;
    return list && list.notes.length > 0 ? [{ key, label, list }] : [];
  });

  if (tiers.length === 0) return null;

  return (
    <RecordSection
      kicker="The notes"
      support="First spray, then the heart, then what stays."
    >
      <dl className="max-w-[620px]">
        {tiers.map(({ key, label, list }) => (
          <div
            key={key}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-graphite/10 py-4 sm:flex-nowrap"
          >
            <dt className="w-[84px] shrink-0 text-[13px] text-terra">
              {label}
            </dt>
            <dd className="min-w-0">
              <span className="text-[17px] leading-[1.6] text-graphite">
                {list.notes.join(", ")}
              </span>
              {list.notesTranslation && list.notesTranslation.length > 0 ? (
                <Urdu
                  size="sm"
                  tone="brass-deep"
                  leading="loose"
                  className="mt-1"
                >
                  {list.notesTranslation.join("، ")}
                </Urdu>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </RecordSection>
  );
}
