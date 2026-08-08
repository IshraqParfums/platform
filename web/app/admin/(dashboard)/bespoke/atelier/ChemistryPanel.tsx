"use client";

/**
 * The formula at the molecule level.
 *
 * This is the number no per-material field can show. A formula can hold six
 * materials, none of which looks like a linalool problem, and still be 8%
 * linalool because it is spread across all six — and the EU declarable
 * threshold is on the finished product's total, not on any one ingredient.
 * Same for limonene, eugenol, coumarin and citral.
 *
 * The undisclosed line is deliberately at the top rather than buried. If a
 * third of the compound is proprietary base, every number below it is a
 * partial view and the perfumer should be told that first, not last.
 */

import { useState } from "react";

import type { AtelierMaterial, ConstituentTotal } from "@ishraqparfums/shared";

const CONFIDENCE_LABEL: Record<string, string> = {
  "published-range": "typical published GC range",
  "supplier-declared": "supplier-declared",
  assay: "single molecule at commercial purity",
  "proprietary-partial": "partly declared",
  "proprietary-undisclosed": "not declared",
};

export function ChemistryPanel({
  totals,
  undisclosedPct,
  neatLoad,
  rows,
  byId,
  colours,
}: {
  totals: ConstituentTotal[];
  undisclosedPct: number;
  neatLoad: number;
  rows: { materialId: string; neatPct: number }[];
  byId: Map<string, AtelierMaterial>;
  colours: Map<string, string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#f6ecdc]/40">
        Add a material and this will show what the formula is made of.
      </p>
    );
  }

  const allergens = totals.filter((t) => t.constituent.eu_allergen);
  const shown = showAll ? totals : totals.slice(0, 15);

  return (
    <div className="flex flex-col gap-5">
      {/* --------------------------------------------------- what we know */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <span className="text-[#f6ecdc]/45">
          neat load <span className="tabular-nums text-[#f6ecdc]/80">{neatLoad.toFixed(2)}%</span>
        </span>
        <span className="text-[#f6ecdc]/45">
          identified{" "}
          <span className="tabular-nums text-[#f6ecdc]/80">
            {totals.reduce((s, t) => s + t.pct, 0).toFixed(2)}%
          </span>{" "}
          across {totals.length} molecules
        </span>
        <span className={undisclosedPct > neatLoad * 0.25 ? "text-[#e0a060]" : "text-[#f6ecdc]/45"}>
          undisclosed <span className="tabular-nums">{undisclosedPct.toFixed(2)}%</span>
          {undisclosedPct > neatLoad * 0.25 && " — a quarter of this formula is unreadable"}
        </span>
      </div>

      {/* -------------------------------------------------- allergen total */}
      {allergens.length > 0 && (
        <div className="rounded-lg border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.03] p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[#c9963e]">
            EU declarable, summed across every source
          </p>
          <ul className="mt-2 space-y-1">
            {allergens.map((t) => (
              <li key={t.constituent.id} className="flex items-baseline gap-2 text-xs">
                <span className="text-[#f6ecdc]/80">{t.constituent.name}</span>
                <span className="text-[10px] text-[#f6ecdc]/35">
                  from {t.sources.length} material{t.sources.length === 1 ? "" : "s"}
                </span>
                <span className="ml-auto tabular-nums text-[#f6ecdc]/60">{fmt(t.pct)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 border-t border-[#f6ecdc]/8 pt-2 text-[10px] leading-relaxed text-[#f6ecdc]/35">
            These are percentages of the <em>compound</em>. The 0.001%/0.01% labelling thresholds
            apply to the finished product, so divide by your dilution before comparing. Labelling is
            a duty, not a limit — and this is a working figure, not a compliance report.
          </p>
        </div>
      )}

      {/* --------------------------------------------------------- roll-up */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
          Every molecule in the compound
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f6ecdc]/15 text-left text-[10px] uppercase tracking-wide text-[#f6ecdc]/45">
                <th className="py-1.5 pr-2 font-medium">Molecule</th>
                <th className="py-1.5 pr-2 font-medium">Class</th>
                <th className="py-1.5 pr-2 font-medium">Tier</th>
                <th className="py-1.5 text-right font-medium">% of compound</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((total) => {
                const open = expanded === total.constituent.id;
                return (
                  <tr
                    key={total.constituent.id}
                    className="border-b border-[#f6ecdc]/8 align-top last:border-0"
                  >
                    <td className="py-1.5 pr-2">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : total.constituent.id)}
                        className="text-left text-[#f6ecdc] transition-colors hover:text-[#c9963e]"
                      >
                        {total.constituent.name}
                        {total.constituent.eu_allergen && (
                          <span className="ml-1.5 text-[9px] uppercase tracking-wide text-[#c9963e]">
                            allergen
                          </span>
                        )}
                      </button>
                      {open && (
                        <div className="mt-1.5 mb-1 space-y-1.5">
                          <p className="text-[11px] leading-relaxed text-[#f6ecdc]/55">
                            {total.constituent.odour}
                          </p>
                          {total.constituent.note && (
                            <p className="text-[10px] leading-relaxed text-[#f6ecdc]/40">
                              {total.constituent.note}
                            </p>
                          )}
                          <ul className="space-y-0.5">
                            {total.sources.map((source) => (
                              <li
                                key={source.materialId}
                                className="flex items-center gap-1.5 text-[10px] text-[#f6ecdc]/50"
                              >
                                <span
                                  aria-hidden
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ background: colours.get(source.materialId) }}
                                />
                                {source.materialName.split(" (")[0]}
                                <span className="ml-auto tabular-nums">{fmt(source.pct)}%</span>
                              </li>
                            ))}
                          </ul>
                          {total.constituent.cas && (
                            <p className="text-[10px] text-[#f6ecdc]/30">
                              CAS {total.constituent.cas}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-[#f6ecdc]/45">
                      {total.constituent.chemical_class}
                    </td>
                    <td className="py-1.5 pr-2 text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">
                      {total.constituent.volatility}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-[#f6ecdc]/70">
                      {fmt(total.pct)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totals.length > 15 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-2 text-[11px] uppercase tracking-wide text-[#c9963e] transition-opacity hover:opacity-70"
          >
            {showAll ? "Show the top 15" : `Show all ${totals.length}`}
          </button>
        )}
      </div>

      {/* ---------------------------------------------- per-material break */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
          What each material is
        </p>
        <ul className="mt-2 space-y-2">
          {rows.map((row) => {
            const material = byId.get(row.materialId);
            if (!material) return null;
            return (
              <MaterialComposition
                key={row.materialId}
                material={material}
                colour={colours.get(row.materialId) ?? "#f6ecdc"}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function MaterialComposition({
  material,
  colour,
}: {
  material: AtelierMaterial;
  colour: string;
}) {
  const [open, setOpen] = useState(false);
  const composition = material.composition;
  const undisclosed = composition.undisclosed_pct;

  const sorted = [...composition.constituents].sort((a, b) => b.pct - a.pct);

  return (
    <li className="rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colour }} />
        <span className="min-w-0 flex-1 truncate text-sm text-[#f6ecdc]">{material.name}</span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">
          {composition.constituents.length > 0
            ? `${composition.constituents.length} listed`
            : "not declared"}
        </span>
        {undisclosed >= 50 && (
          <span className="shrink-0 text-[10px] tabular-nums text-[#e0a060]">
            {undisclosed.toFixed(0)}% unknown
          </span>
        )}
        <span aria-hidden className="shrink-0 text-[#f6ecdc]/30">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-[#f6ecdc]/8 px-3.5 py-3">
          <p className="text-[11px] leading-relaxed text-[#f6ecdc]/50">{composition.basis}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#f6ecdc]/35">
            {CONFIDENCE_LABEL[composition.confidence] ?? composition.confidence}
          </p>

          {sorted.length > 0 ? (
            <ul className="mt-2.5 space-y-1">
              {sorted.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-right tabular-nums text-[#f6ecdc]/45">
                    {fmt(c.pct)}%
                  </span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#f6ecdc]/8">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${Math.min(c.pct, 100)}%`, background: colour, opacity: 0.7 }}
                    />
                  </span>
                  <span className="w-[46%] shrink-0 truncate text-[#f6ecdc]/70">{c.id.replace(/_/g, " ")}</span>
                </li>
              ))}
              {undisclosed > 0.01 && (
                <li className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-right tabular-nums text-[#f6ecdc]/30">
                    {fmt(undisclosed)}%
                  </span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#f6ecdc]/8">
                    <span
                      className="block h-full rounded-full bg-[#f6ecdc]/15"
                      style={{ width: `${Math.min(undisclosed, 100)}%` }}
                    />
                  </span>
                  <span className="w-[46%] shrink-0 truncate text-[#f6ecdc]/35">
                    not accounted for
                  </span>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2.5 text-xs leading-relaxed text-[#f6ecdc]/50">
              Nothing is declared for this base, so nothing is listed. A rose base&rsquo;s obvious
              constituents are guessable, but a guess would be indistinguishable from a measurement
              once it is in the table — so it melds on facets alone.
            </p>
          )}

          {material.keyChemistry && (
            <p className="mt-2.5 border-t border-[#f6ecdc]/8 pt-2 text-[10px] text-[#f6ecdc]/40">
              {material.chemicalFamily}
              {material.chemicalFamily && material.keyChemistry ? " · " : ""}
              {material.keyChemistry}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function fmt(pct: number): string {
  if (pct >= 10) return pct.toFixed(1);
  if (pct >= 1) return pct.toFixed(2);
  if (pct >= 0.001) return pct.toFixed(3);
  return pct.toExponential(1);
}
