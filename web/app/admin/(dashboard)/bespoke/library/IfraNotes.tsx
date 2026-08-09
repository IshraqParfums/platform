import type { LibraryIfraNote } from "@ishraqparfums/shared";

/**
 * The materials in a formula that carry a real IFRA restriction — never the
 * whole ingredient list, and never a computed pass/fail. ifraCat4Pct is a
 * limit on the FINISHED product; the formula's own neatPct is pre-dilution.
 * Those aren't the same number, which is exactly why this stays a flag for a
 * human to check against the actual output concentration, not an automatic
 * verdict.
 *
 * Ported from Bespoke's web/app/admin/IfraNotes.tsx.
 */
export function IfraNotes({ notes }: { notes: LibraryIfraNote[] }) {
  if (notes.length === 0) {
    return <p className="mt-2 text-sm text-[#f6ecdc]/50">No IFRA-restricted materials in this formula.</p>;
  }

  return (
    <div className="mt-2">
      <p className="text-xs leading-relaxed text-[#f6ecdc]/50">
        Limits are per Category 4 (fine fragrance), as a share of the <em>finished</em> product — not the
        formula&rsquo;s own neat percentages above, which are pre-dilution. Verify against the current IFRA
        amendment and the actual dilution before any commercial batch.
      </p>
      <ul className="mt-3 space-y-2.5">
        {notes.map((n) => (
          <li key={n.materialId} className="rounded-lg border border-[#c9963e]/25 bg-[#c9963e]/[0.06] px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-[#f6ecdc]">{n.materialName}</span>
              {n.ifraCat4Pct !== null && (
                <span className="font-mono text-xs text-[#c9963e]">max {n.ifraCat4Pct}% of finished product</span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#f6ecdc]/65">{n.ifraNote}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default IfraNotes;
