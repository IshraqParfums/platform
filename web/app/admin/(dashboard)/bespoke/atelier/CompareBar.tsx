"use client";

/**
 * Two versions, side by side.
 *
 * Iterating means changing one thing and asking whether it helped. Without a
 * comparison you are holding the previous version in your head — which works
 * for one number and stops working at three. Pin a snapshot, keep working,
 * and the difference is stated rather than remembered.
 *
 * The diff is on the formula and on the numbers the formula produces: what
 * changed, what it did to the neat load, and whether it fixed or created a
 * structural gap. That last column is the point — "I raised the bergamot" is
 * an action, "it closed the thin top and opened nothing new" is a result.
 */

import type { AtelierMaterial, FormulaRow, Gap } from "@ishraqparfums/shared";

export interface Pinned {
  label: string;
  rows: FormulaRow[];
  neatLoad: number;
  gapLabels: string[];
  wearHours: number;
}

interface DiffRow {
  material: AtelierMaterial;
  before: number | null;
  after: number | null;
}

export function CompareBar({
  pinned,
  rows,
  byId,
  neatLoad,
  gaps,
  wearHours,
  onPin,
  onClear,
  onRestore,
}: {
  pinned: Pinned | null;
  rows: FormulaRow[];
  byId: Map<string, AtelierMaterial>;
  neatLoad: number;
  gaps: Gap[];
  wearHours: number;
  onPin: () => void;
  onClear: () => void;
  onRestore: (rows: FormulaRow[]) => void;
}) {
  if (!pinned) {
    if (rows.length === 0) return null;
    return (
      <button
        type="button"
        onClick={onPin}
        title="Freeze this version so you can see what your next change does to it"
        className="self-start text-[11px] uppercase tracking-wide text-[#f6ecdc]/35 transition-colors hover:text-[#c9963e]"
      >
        ⌗ Pin this version to compare against
      </button>
    );
  }

  const before = new Map(pinned.rows.map((r) => [r.materialId, r.neatPct]));
  const after = new Map(rows.map((r) => [r.materialId, r.neatPct]));
  const ids = new Set([...before.keys(), ...after.keys()]);

  const diffs: DiffRow[] = [];
  for (const id of ids) {
    const material = byId.get(id);
    if (!material) continue;
    const b = before.get(id) ?? null;
    const a = after.get(id) ?? null;
    if (b !== null && a !== null && Math.abs(a - b) < 0.0005) continue;
    diffs.push({ material, before: b, after: a });
  }
  diffs.sort((x, y) => Math.abs(delta(y)) - Math.abs(delta(x)));

  const nowGaps = new Set(gaps.map((g) => g.label));
  const thenGaps = new Set(pinned.gapLabels);
  const closed = [...thenGaps].filter((g) => !nowGaps.has(g));
  const opened = [...nowGaps].filter((g) => !thenGaps.has(g));

  return (
    <section className="rounded-xl border border-[#8FA8C2]/25 bg-[#8FA8C2]/[0.04] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wide text-[#8FA8C2]">
          Against <span className="text-[#f6ecdc]/80">{pinned.label}</span>
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRestore(pinned.rows)}
            className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/40 transition-colors hover:text-[#c9963e]"
          >
            Go back to it
          </button>
          <button
            type="button"
            onClick={onPin}
            className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/40 transition-colors hover:text-[#c9963e]"
          >
            Re-pin to now
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/30 transition-colors hover:text-[#f6ecdc]"
          >
            Stop comparing
          </button>
        </div>
      </div>

      {diffs.length === 0 ? (
        <p className="mt-2.5 text-xs text-[#f6ecdc]/45">
          Identical so far — nothing has changed since you pinned it.
        </p>
      ) : (
        <ul className="mt-2.5 space-y-0.5">
          {diffs.map((d) => (
            <li key={d.material.id} className="flex items-baseline gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-[#f6ecdc]/75">
                {d.material.name.split(" (")[0]}
              </span>
              <span className="shrink-0 tabular-nums text-[#f6ecdc]/40">
                {d.before === null ? "—" : `${d.before}%`}
              </span>
              <span aria-hidden className="shrink-0 text-[#f6ecdc]/25">
                →
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums text-[#f6ecdc]/75">
                {d.after === null ? "removed" : `${d.after}%`}
              </span>
              <span
                className="w-16 shrink-0 text-right tabular-nums"
                style={{ color: delta(d) > 0 ? "#c9963e" : "#8FA8C2" }}
              >
                {d.before === null ? "added" : d.after === null ? "" : signed(delta(d))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#f6ecdc]/8 pt-2.5 text-[11px]">
        <span className="text-[#f6ecdc]/45">
          neat load{" "}
          <span className="tabular-nums text-[#f6ecdc]/75">
            {pinned.neatLoad.toFixed(2)}% → {neatLoad.toFixed(2)}%
          </span>
        </span>
        <span className="text-[#f6ecdc]/45">
          wears{" "}
          <span className="tabular-nums text-[#f6ecdc]/75">
            {formatHours(pinned.wearHours)} → {formatHours(wearHours)}
          </span>
        </span>
        {closed.length > 0 && (
          <span className="text-[#c9963e]">closed: {closed.join(", ")}</span>
        )}
        {opened.length > 0 && (
          <span className="text-[#e0a060]">opened: {opened.join(", ")}</span>
        )}
        {closed.length === 0 && opened.length === 0 && diffs.length > 0 && (
          <span className="text-[#f6ecdc]/35">no structural gap opened or closed</span>
        )}
      </div>
    </section>
  );
}

function delta(d: DiffRow): number {
  return (d.after ?? 0) - (d.before ?? 0);
}

function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(3)}`;
}

function formatHours(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours >= 24) return "24h+";
  return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)}h`;
}
