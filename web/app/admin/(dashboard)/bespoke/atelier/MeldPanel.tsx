"use client";

/**
 * How well the formula holds together, and where it does not.
 *
 * The grid is every pair in the formula scored against every other. Reading
 * it is the point: a formula that is gold everywhere will read as one thing,
 * a formula with a dark row has a material nothing else is talking to. Click
 * any cell to see the actual evidence — which molecules, which facets — so
 * the score is never something you have to take on trust.
 */

import { useMemo, useState } from "react";

import {
  affinity,
  facetLabel,
  FUSED_THRESHOLD,
  ORPHAN_THRESHOLD,
  type Affinity,
  type AffinityMaterial,
  type AtelierMaterial,
  type BridgeSuggestion,
  type CohesionReport,
  type Constituent,
  type FacetLexicon,
} from "@ishraqparfums/shared";

import { shortLabel } from "./VolatilityChart";

const KIND_LABEL: Record<string, string> = {
  "secondary-secondary": "both carry it underneath",
  "primary-secondary": "one leads with it, one carries it",
  "primary-primary": "both lead with it",
  cluster: "same perceptual cluster",
};

export function MeldPanel({
  formula,
  report,
  bridges,
  lexicon,
  constituentsById,
  pairsWith,
  colours,
  byId,
  onAdd,
}: {
  formula: AffinityMaterial[];
  report: CohesionReport;
  bridges: BridgeSuggestion[];
  lexicon: FacetLexicon;
  constituentsById: Map<string, Constituent>;
  pairsWith: Map<string, Set<string>>;
  colours: Map<string, string>;
  byId: Map<string, AtelierMaterial>;
  onAdd: (material: AtelierMaterial) => void;
}) {
  const [selected, setSelected] = useState<[string, string] | null>(null);

  const pair = useMemo(() => {
    if (!selected) return null;
    const a = formula.find((m) => m.id === selected[0]);
    const b = formula.find((m) => m.id === selected[1]);
    if (!a || !b) return null;
    return affinity(a, b, lexicon, constituentsById, pairsWith);
  }, [selected, formula, lexicon, constituentsById, pairsWith]);

  if (formula.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-[#f6ecdc]/40">
        Add a second material and this will show what the two have in common.
      </p>
    );
  }

  const scores = new Map(report.edges.map((e) => [key(e.a, e.b), e]));
  const split = report.clusters.length > 1;

  return (
    <div className="flex flex-col gap-5">
      <Verdict report={report} byId={byId} />

      {/* ------------------------------------------------------------ grid */}
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-[3px] text-[10px]">
          <tbody>
            {formula.map((row, i) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="max-w-[132px] truncate pr-2 text-right font-normal"
                  style={{ color: colours.get(row.id) ?? "#f6ecdc" }}
                  title={row.name}
                >
                  {shortLabel(row.name)}
                </th>
                {formula.map((col, j) => {
                  if (j >= i) return <td key={col.id} className="h-7 w-7" />;
                  const edge = scores.get(key(row.id, col.id));
                  const score = edge?.score ?? 0;
                  const isSelected =
                    selected !== null &&
                    ((selected[0] === row.id && selected[1] === col.id) ||
                      (selected[0] === col.id && selected[1] === row.id));
                  return (
                    <td key={col.id} className="p-0">
                      <button
                        type="button"
                        onClick={() => setSelected([row.id, col.id])}
                        title={`${shortLabel(row.name)} × ${shortLabel(col.name)} — ${(score * 100).toFixed(0)}%`}
                        aria-label={`Affinity between ${row.name} and ${col.name}: ${(score * 100).toFixed(0)} percent`}
                        className={`flex h-7 w-7 items-center justify-center rounded text-[9px] tabular-nums transition-all ${
                          isSelected ? "ring-2 ring-[#f6ecdc]" : "hover:ring-1 hover:ring-[#f6ecdc]/50"
                        }`}
                        style={cellStyle(score)}
                      >
                        {score >= FUSED_THRESHOLD ? "●" : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td />
              {formula.slice(0, -1).map((col) => (
                <td key={col.id} className="pt-1 align-top">
                  <span
                    className="block h-2 w-2 rounded-full"
                    style={{ background: colours.get(col.id) }}
                    title={col.name}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#f6ecdc]/35">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={cellStyle(0.02)} /> nothing in common
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={cellStyle(0.35)} /> a thread between them
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={cellStyle(0.85)} /> ● will read as one material
        </span>
        <span>Click a square for the evidence.</span>
      </p>

      {pair && <PairDetail pair={pair} byId={byId} lexicon={lexicon} />}

      {/* ---------------------------------------------------------- seams */}
      {(report.orphans.length > 0 || split) && (
        <div className="rounded-lg border border-[#e0a060]/25 bg-[#e0a060]/[0.06] p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[#e0a060]">The seam</p>
          {report.orphans.length > 0 && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#f6ecdc]/70">
              {listNames(report.orphans, byId)}{" "}
              {report.orphans.length === 1 ? "shares" : "share"} nothing measurable with the rest of
              the formula — no molecule, no facet, no bridge. {report.orphans.length === 1 ? "It" : "They"}{" "}
              will sit on top rather than blend in.
            </p>
          )}
          {split && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#f6ecdc]/70">
              This is two formulas, not one: {listNames(report.clusters[0], byId)} on one side,{" "}
              {listNames(report.clusters[1], byId)} on the other, with nothing crossing between them.
            </p>
          )}
        </div>
      )}

      {/* -------------------------------------------------------- bridges */}
      {bridges.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
            What would close it
          </p>
          <p className="mt-0.5 text-[10px] text-[#f6ecdc]/35">
            Scored on the weaker of the two new links — a material that matches one side perfectly
            and the other not at all is not a bridge.
          </p>
          <ul className="mt-2 space-y-2">
            {bridges.map((bridge) => {
              const material = byId.get(bridge.material.id);
              return (
                <li
                  key={bridge.material.id}
                  className="flex items-start gap-3 rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03] px-3.5 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm text-[#f6ecdc]">{bridge.material.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[#c9963e]">
                        {Math.round(bridge.strength * 100)}% to both sides
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[#f6ecdc]/55">
                      {bridge.reason}
                    </span>
                  </span>
                  {material && (
                    <button
                      type="button"
                      onClick={() => onAdd(material)}
                      className="shrink-0 rounded-full border border-[#c9963e]/40 px-3 py-1 text-[11px] uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
                    >
                      Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Verdict({
  report,
  byId,
}: {
  report: CohesionReport;
  byId: Map<string, AtelierMaterial>;
}) {
  const pct = Math.round(report.cohesion * 100);
  const strongest = report.edges[0];
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p className="text-sm text-[#f6ecdc]/75">
        Average affinity <span className="text-[#c9963e] tabular-nums">{pct}%</span>
      </p>
      {report.fused.length > 0 && (
        <p className="text-xs text-[#f6ecdc]/45">
          {report.fused.length} pair{report.fused.length === 1 ? "" : "s"} will read as one material
        </p>
      )}
      {strongest && strongest.score >= ORPHAN_THRESHOLD && (
        <p className="text-xs text-[#f6ecdc]/45">
          held together mostly by {byId.get(strongest.a)?.name.split(" (")[0]} and{" "}
          {byId.get(strongest.b)?.name.split(" (")[0]}
        </p>
      )}
    </div>
  );
}

function PairDetail({
  pair,
  byId,
  lexicon,
}: {
  pair: Affinity;
  byId: Map<string, AtelierMaterial>;
  lexicon: FacetLexicon;
}) {
  const a = byId.get(pair.a);
  const b = byId.get(pair.b);
  const nothing =
    pair.constituents.length === 0 && pair.facets.length === 0 && pair.bridges.length === 0;

  return (
    <div className="rounded-lg border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.04] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-[#f6ecdc]">
          {a?.name} <span className="text-[#f6ecdc]/35">×</span> {b?.name}
        </p>
        <p className="text-xs tabular-nums text-[#c9963e]">{Math.round(pair.score * 100)}%</p>
      </div>

      {pair.constituents.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">
            Same molecules —{" "}
            <span className="text-[#c9963e]">{pair.chemicalOverlapPct.toFixed(1)}% shared mass</span>
          </p>
          <ul className="mt-1.5 space-y-1">
            {pair.constituents.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-baseline gap-2 text-xs">
                <span className="text-[#f6ecdc]/80">{c.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-[#f6ecdc]/45">
                  {fmtPct(c.pctA)} · {fmtPct(c.pctB)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pair.facets.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">Same facets</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {pair.facets.map((f) => (
              <li
                key={f.facet}
                title={KIND_LABEL[f.kind]}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                  f.kind === "secondary-secondary"
                    ? "bg-[#c9963e]/20 text-[#e8c98a]"
                    : "bg-[#f6ecdc]/8 text-[#f6ecdc]/60"
                }`}
              >
                {facetLabel(lexicon, f.facet)}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] text-[#f6ecdc]/30">
            Highlighted ones are carried underneath by both — that is what melds, rather than two
            materials simply being the same kind of thing.
          </p>
        </div>
      )}

      {pair.bridges.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">Facets that reach</p>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#f6ecdc]/55">
            {pair.bridges.slice(0, 5).map((x) => (
              <li key={`${x.facetA}-${x.facetB}`}>
                {facetLabel(lexicon, x.facetA)} <span className="text-[#f6ecdc]/30">→</span>{" "}
                {facetLabel(lexicon, x.facetB)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {nothing && (
        <p className="mt-3 text-xs leading-relaxed text-[#f6ecdc]/50">
          No molecule, no facet and no bridge in common. Whatever these two do together, the data
          cannot account for it.
        </p>
      )}

      {pair.chemistryUnavailable && (
        <p className="mt-3 border-t border-[#f6ecdc]/8 pt-2 text-[10px] leading-relaxed text-[#f6ecdc]/35">
          One of these is a proprietary base with no declared composition, so this score rests on
          facets alone. Its chemistry is not unknown to the engine — it is unknowable from the data,
          which is a different thing and the reason nothing was guessed.
        </p>
      )}

      {pair.handAuthored && (
        <p className="mt-2 text-[10px] text-[#f6ecdc]/35">
          Also listed in the palette&rsquo;s hand-authored <code>pairs_with</code>.
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- helpers */

function key(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Gold at an opacity that tracks the score, on a base that stays visible at
 * zero — an empty cell has to look like a measured nothing, not like a
 * rendering failure.
 */
function cellStyle(score: number): React.CSSProperties {
  const t = Math.min(score / 0.7, 1);
  return {
    background: `rgba(201, 150, 62, ${(0.06 + t * 0.85).toFixed(3)})`,
    color: t > 0.55 ? "#241510" : "rgba(246,236,220,0.5)",
  };
}

function fmtPct(pct: number): string {
  if (pct >= 1) return `${pct}%`;
  if (pct >= 0.01) return `${pct}%`;
  return "trace";
}

function listNames(ids: string[], byId: Map<string, AtelierMaterial>): string {
  const names = ids.map((id) => byId.get(id)?.name.split(" (")[0] ?? id);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
