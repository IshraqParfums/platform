"use client";

/**
 * What is missing, and what would fix it — recomputed every time the formula
 * changes.
 *
 * Sits directly under the search box rather than in a tab, because it is not
 * analysis you go and look at afterwards; it is the thing you read between
 * adding one material and adding the next. Every other panel answers a
 * question about the formula you have. This one is about the formula you do
 * not have yet.
 *
 * The map comes first and the list second, deliberately. Handing someone a
 * ranked list of materials without saying what is wrong is a slot machine;
 * saying "there is no base note and nothing in the air after four hours"
 * turns the same list into an argument they can agree or disagree with.
 */

import { useState } from "react";

import {
  BESPOKE_FAMILY_PALETTE as FAMILY_PALETTE,
  type AtelierMaterial,
  type DoseRemedy,
  type Gap,
  type Suggestion,
} from "@ishraqparfums/shared";

const GAP_TONE: Record<string, string> = {
  tier: "#e0a060",
  timeline: "#c9963e",
  fixative: "#e0a060",
  diffusion: "#9C8FA0",
  crowding: "#8FA8C2",
};

const TIER_LABEL: Record<string, string> = { top: "top", heart: "heart", base: "base" };

/**
 * The one line worth showing next to a name.
 *
 * The top-scoring reason is usually the gap being closed — and when five
 * candidates are all closing the same gap, five rows reading "a heart note,
 * which this formula does not have" tell you nothing about which to pick. The
 * gap chips above already said what is missing and the tier badge already
 * said which tier this is, so the row spends its line on what actually
 * separates these candidates: how it connects, or failing that, what it
 * smells of.
 */
function distinguishingLine(s: Suggestion): string {
  const connective = s.reasons.find((r) => r.kind !== "fills");
  return connective?.text ?? s.material.odour;
}

export function NextMoves({
  gaps,
  remedies,
  suggestions,
  hasFormula,
  onAdd,
  onSetPct,
}: {
  gaps: Gap[];
  /** Fixes that change a number instead of adding a material. */
  remedies: DoseRemedy[];
  suggestions: Suggestion[];
  hasFormula: boolean;
  onAdd: (material: AtelierMaterial) => void;
  onSetPct: (materialId: string, neatPct: number) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (suggestions.length === 0 && remedies.length === 0) return null;

  return (
    <section className="rounded-xl border border-[#c9963e]/25 bg-[#c9963e]/[0.04] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wide text-[#c9963e]">
          {hasFormula ? "What this still needs" : "Where to start"}
        </h2>
        {hasFormula && gaps.length === 0 && (
          <p className="text-[11px] text-[#f6ecdc]/45">
            Structurally complete — everything below is a choice, not a repair.
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------- map */}
      {gaps.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {gaps.map((gap) => (
            <li
              key={gap.label}
              title={gap.detail}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
              style={{
                borderColor: `${GAP_TONE[gap.kind] ?? "#c9963e"}55`,
                color: GAP_TONE[gap.kind] ?? "#c9963e",
              }}
            >
              <span
                aria-hidden
                className="h-1 w-6 overflow-hidden rounded-full bg-current/20"
                style={{ background: "rgba(246,236,220,0.15)" }}
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.round(gap.severity * 100)}%`,
                    background: GAP_TONE[gap.kind] ?? "#c9963e",
                  }}
                />
              </span>
              {gap.label}
            </li>
          ))}
        </ul>
      )}
      {gaps.length > 0 && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#f6ecdc]/35">
          {gaps[0].detail} Hover any of the others for what they mean.
        </p>
      )}

      {/* --------------------------------------------------------- remedies */}
      {remedies.length > 0 && (
        <div className="mt-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
            Or change what is already there
          </p>
          <ul className="mt-1.5 space-y-1">
            {remedies.map((r) => (
              <li
                key={`${r.gapLabel}-${r.materialId}`}
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03] px-3 py-2"
              >
                <span className="text-sm text-[#f6ecdc]">
                  {r.materialName.split(" (")[0]}
                </span>
                <span className="tabular-nums text-xs text-[#f6ecdc]/45">
                  {r.from}%{" "}
                  <span className="text-[#f6ecdc]/30">{r.to > r.from ? "→" : "→"}</span>{" "}
                  <span className={r.to > r.from ? "text-[#c9963e]" : "text-[#8FA8C2]"}>
                    {r.to}%
                  </span>
                </span>
                {r.short && (
                  <span className="rounded-full bg-[#e0a060]/15 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#e0a060]">
                    partial
                  </span>
                )}
                <span className="w-full text-[11px] leading-relaxed text-[#f6ecdc]/50 sm:w-auto sm:flex-1">
                  {r.detail}
                </span>
                <button
                  type="button"
                  onClick={() => onSetPct(r.materialId, r.to)}
                  className="shrink-0 rounded-full border border-[#c9963e]/40 px-3 py-1 text-[11px] uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/15"
                >
                  Apply
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#f6ecdc]/30">
            Often the cheaper fix. Not every gap has one — you cannot re-dose your way to a base
            note you do not own.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------ list */}
      {remedies.length > 0 && suggestions.length > 0 && (
        <p className="mt-4 text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
          Or bring something in
        </p>
      )}
      <ul className="mt-2 space-y-1">
        {suggestions.map((s) => {
          const open = expanded === s.material.id;
          const family = s.material.primaryFamily;
          return (
            <li
              key={s.material.id}
              className="rounded-lg border border-transparent transition-colors hover:border-[#f6ecdc]/10 hover:bg-[#f6ecdc]/[0.03]"
            >
              <div className="flex items-center gap-2.5 px-2.5 py-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: family ? FAMILY_PALETTE[family].accent : "#9C8FA0",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : s.material.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm text-[#f6ecdc]">
                      {s.material.name.split(" (")[0]}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/35">
                      {TIER_LABEL[s.material.notePosition]}
                    </span>
                    {s.redundantWith && (
                      <span className="rounded-full bg-[#e0a060]/15 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#e0a060]">
                        would double {s.redundantWith.name.split(" (")[0]}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#f6ecdc]/55">
                    {distinguishingLine(s)}
                  </span>
                </button>
                <span className="shrink-0 text-[10px] tabular-nums text-[#f6ecdc]/30">
                  {s.suggestedPct}%
                </span>
                <button
                  type="button"
                  onClick={() => onAdd(s.material)}
                  className="shrink-0 rounded-full border border-[#c9963e]/40 px-3 py-1 text-[11px] uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/15"
                >
                  Add
                </button>
              </div>

              {open && (
                <div className="border-t border-[#f6ecdc]/8 px-2.5 py-2.5">
                  <p className="text-[11px] leading-relaxed text-[#f6ecdc]/60">
                    {s.material.odour}
                  </p>
                  {s.reasons.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {s.reasons.map((r, i) => (
                        <li key={i} className="flex gap-1.5 text-[11px] text-[#f6ecdc]/50">
                          <span className="text-[#c9963e]">·</span>
                          {r.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.material.effectInMixture && (
                    <p className="mt-2 text-[10px] leading-relaxed text-[#f6ecdc]/35">
                      {s.material.effectInMixture}
                    </p>
                  )}
                  {s.redundantWith && (
                    <p className="mt-2 text-[10px] leading-relaxed text-[#e0a060]/80">
                      This would read as the same material as{" "}
                      {s.redundantWith.name.split(" (")[0]} rather than as a second idea. Sometimes
                      that is exactly what a formula needs — but it should be your call, not the
                      tool&rsquo;s.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-[10px] leading-relaxed text-[#f6ecdc]/30">
        Ranked on what is missing first and how well it fits second, with anything that would
        duplicate a material already in the formula pushed down. Click a name for the reasoning.
      </p>
    </section>
  );
}
