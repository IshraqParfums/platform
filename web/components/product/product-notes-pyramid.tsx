import type { ProductNoteList, ProductNotesPyramid } from "@ishraqparfums/shared";
import { Reveal } from "@/components/ui/reveal";

const TIERS: { key: "opening" | "heart" | "base"; label: string }[] = [
  { key: "opening", label: "Opening" },
  { key: "heart", label: "Heart" },
  { key: "base", label: "Base" },
];

/**
 * Fragrance notes pyramid — reuses `bespoke-entry.tsx`'s numbered-list
 * pattern verbatim, with tier labels (Opening/Heart/Base) in place of the
 * zero-padded 01/02/03 index. Tiers with no data are skipped.
 */
export function ProductNotesPyramid({
  notesPyramid,
}: {
  notesPyramid: ProductNotesPyramid | null;
}) {
  if (!notesPyramid) return null;

  const tiers = TIERS.map(({ key, label }) => ({
    key,
    label,
    list: notesPyramid[key],
  })).filter(
    (
      tier,
    ): tier is {
      key: "opening" | "heart" | "base";
      label: string;
      list: ProductNoteList;
    } => tier.list !== null,
  );

  if (tiers.length === 0) return null;

  return (
    <Reveal>
      <div className="border-t border-graphite/10 pt-6">
        <p className="text-[13px] text-terra">Fragrance notes</p>
        <ol className="mt-4">
          {tiers.map(({ key, label, list }) => (
            <li
              key={key}
              className="flex items-baseline gap-4 border-t border-graphite/10 py-4"
            >
              <span className="w-14 shrink-0 font-ui text-[11px] font-semibold text-terra">
                {label}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] text-graphite">
                  {list.notes.join(", ")}
                </p>
                {list.notesTranslation && list.notesTranslation.length > 0 ? (
                  <p className="mt-1 text-[13px] text-graphite-faint">
                    {list.notesTranslation.join(", ")}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
