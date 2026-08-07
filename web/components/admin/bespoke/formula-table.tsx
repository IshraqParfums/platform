import type { BespokeAccordFormulaLine } from "@ishraqparfums/shared";
import { cn } from "@/lib/cn";

/**
 * Dual-column bench output required by the engine spec: what to weigh *today*
 * against the bench's current stock dilutions, and what to weigh *later* once
 * neat material arrives. Both columns are stored pre-computed at a 10 g
 * reference batch, so scaling is a single multiplier.
 */
export function FormulaTable({
  lines,
  neatLoadPct,
  batchReferenceG,
  scale = 1,
  className,
}: {
  lines: BespokeAccordFormulaLine[];
  neatLoadPct: number;
  batchReferenceG: number;
  /** Multiplier applied to both gram columns (1 = the stored reference batch). */
  scale?: number;
  className?: string;
}) {
  const warnings = lines.filter((line) => line.bench_warning);
  const scaled = scale !== 1;
  const decimals = scale >= 5 ? 2 : 3;

  return (
    <div className={cn("mt-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-ink-faint">
        <span>
          {lines.length} material{lines.length === 1 ? "" : "s"}
        </span>
        <span>
          neat load {neatLoadPct.toFixed(1)}% · batch{" "}
          {(batchReferenceG * scale).toFixed(scaled ? 1 : 0)} g
        </span>
      </div>

      <div className="mt-2 overflow-x-auto rounded-md border border-ink/10 scrollbar-brand print:overflow-visible">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              <th className="px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 font-medium">Neat %</th>
              <th className="px-3 py-2 font-medium">Today</th>
              <th className="px-3 py-2 font-medium">Later</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr
                key={line.material_id}
                className="border-b border-ink/[0.06] last:border-0 break-inside-avoid"
              >
                <td className="px-3 py-2 align-top text-ink">
                  <span className="font-medium">{line.material_name}</span>
                  <span className="ml-1.5 font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                    {line.note_position}
                  </span>
                  {line.bench_warning ? (
                    <span className="ml-1.5 text-gold-deeper" aria-hidden>
                      ⚠
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top tabular-nums text-ink-soft">
                  {line.neat_pct}%
                </td>
                <td className="px-3 py-2 align-top tabular-nums text-ink-soft">
                  {(line.today.grams_at_10g_batch * scale).toFixed(decimals)} g
                  {line.today.stock_dilution_pct !== 100
                    ? ` @${line.today.stock_dilution_pct}%`
                    : ""}
                  {line.today.solvent ? (
                    <span className="ml-1 text-ink-faint">
                      in {line.today.solvent}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top tabular-nums text-ink-soft">
                  {(line.later.grams_neat_at_10g_batch * scale).toFixed(decimals)} g
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {warnings.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-gold-deeper">
          {warnings.map((line) => (
            <li key={line.material_id}>
              ⚠ {line.material_name}: {line.bench_warning}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
