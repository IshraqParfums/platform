import type { LibraryAccordDetail } from "@ishraqparfums/shared";

/**
 * Dual-column formula output: what to weigh today against current bench
 * dilutions, and what to weigh later once neat material arrives. The
 * formula is already fully computed on every accord — this only renders it.
 *
 * Ported from Bespoke's web/app/bespoke/FormulaTable.tsx, repointed at the
 * camelCase LibraryAccordDetail contract instead of Bespoke's raw
 * (snake_case) Accord type.
 */
export function FormulaTable({ accord }: { accord: LibraryAccordDetail }) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between text-xs text-[#f6ecdc]/60">
        <span>{accord.formula.length} materials</span>
        <span>neat load {accord.neatLoadPct.toFixed(1)}%</span>
      </div>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#f6ecdc]/15 text-left text-[11px] uppercase tracking-wide text-[#f6ecdc]/55">
            <th className="py-1.5 pr-2 font-medium">Material</th>
            <th className="py-1.5 pr-2 font-medium">Neat %</th>
            <th className="py-1.5 pr-2 font-medium">Today</th>
            <th className="py-1.5 font-medium">Later</th>
          </tr>
        </thead>
        <tbody>
          {accord.formula.map((line) => (
            <tr key={line.materialId} className="border-b border-[#f6ecdc]/8">
              <td className="py-1.5 pr-2">
                {line.materialName}
                <span className="ml-1.5 text-[10px] uppercase tracking-wide text-[#f6ecdc]/55">
                  {line.notePosition}
                </span>
              </td>
              <td className="py-1.5 pr-2 text-[#f6ecdc]/80">{line.neatPct}%</td>
              <td className="py-1.5 pr-2 text-[#f6ecdc]/80">
                {line.today.gramsAt10gBatch.toFixed(3)} g
                {line.today.stockDilutionPct !== 100 ? ` @${line.today.stockDilutionPct}%` : ""}
              </td>
              <td className="py-1.5 text-[#f6ecdc]/80">{line.later.gramsNeatAt10gBatch.toFixed(3)} g</td>
            </tr>
          ))}
        </tbody>
      </table>
      {accord.formula.some((line) => line.benchWarning) && (
        <ul className="mt-2 space-y-1 text-xs text-[#c9963e]">
          {accord.formula
            .filter((line) => line.benchWarning)
            .map((line) => (
              <li key={line.materialId}>
                ⚠ {line.materialName}: {line.benchWarning}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default FormulaTable;
