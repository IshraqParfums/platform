"use client";

/**
 * The bench notes that apply right now.
 *
 * A four-material formula can satisfy twenty-odd notes. Showing all of them
 * teaches the perfumer to ignore the panel, which is worse than not having
 * one — so the default is the six most specific, and the rest are one click
 * away. Specificity is the engine's `relevance`: a note that waited for both
 * a citrus top AND a floral heart before speaking has observed something;
 * a note that fires because you own bergamot has not.
 */

import { useState } from "react";

import type { AtelierMaterial, FiredNote } from "@ishraqparfums/shared";

const DEFAULT_SHOWN = 6;

const KIND_STYLE: Record<FiredNote["kind"], { label: string; className: string }> = {
  suggestion: { label: "try", className: "bg-[#c9963e] text-[#241510]" },
  comparison: { label: "or", className: "bg-[#f6ecdc]/15 text-[#f6ecdc]/80" },
  guidance: { label: "note", className: "bg-[#e0a060]/20 text-[#e0a060]" },
  satisfied: { label: "done", className: "bg-[#f6ecdc]/8 text-[#f6ecdc]/45" },
};

export function BenchNotes({
  fired,
  general,
  categories,
  byId,
  onAdd,
}: {
  fired: FiredNote[];
  /**
   * Notes with no trigger at all — Iso E for sillage, hedione for bloom, the
   * structural advice that is true of nearly every formula. They are never
   * pushed, because advice that always applies teaches you to stop reading.
   * They live behind a toggle so they stay findable.
   */
  general: FiredNote[];
  categories: Record<string, string>;
  byId: Map<string, AtelierMaterial>;
  onAdd: (material: AtelierMaterial) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showGeneral, setShowGeneral] = useState(false);

  if (fired.length === 0 && !showGeneral) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-center text-sm text-[#f6ecdc]/40">
          Nothing in the bench notes applies yet. They surface as the formula gives them something
          to react to.
        </p>
        <GeneralToggle open={false} count={general.length} onClick={() => setShowGeneral(true)} />
      </div>
    );
  }

  const shown = showAll ? fired : fired.slice(0, DEFAULT_SHOWN);

  return (
    <div className="flex flex-col gap-3">
      <ul className="space-y-2.5">
        {shown.map((entry) => (
          <NoteCard key={entry.note.id} entry={entry} categories={categories} byId={byId} onAdd={onAdd} />
        ))}
      </ul>

      {fired.length > DEFAULT_SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="self-start text-[11px] uppercase tracking-wide text-[#c9963e] transition-opacity hover:opacity-70"
        >
          {showAll
            ? `Show the ${DEFAULT_SHOWN} most specific`
            : `${fired.length - DEFAULT_SHOWN} more apply — show everything`}
        </button>
      )}

      <div className="mt-1 border-t border-[#f6ecdc]/10 pt-3">
        <GeneralToggle
          open={showGeneral}
          count={general.length}
          onClick={() => setShowGeneral((v) => !v)}
        />
        {showGeneral && (
          <>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#f6ecdc]/30">
              These apply to almost any formula, which is exactly why they are not in the list
              above — advice that is always true stops being read.
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {general.map((entry) => (
                <NoteCard
                  key={entry.note.id}
                  entry={entry}
                  categories={categories}
                  byId={byId}
                  onAdd={onAdd}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function GeneralToggle({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/40 transition-colors hover:text-[#c9963e]"
    >
      {open ? "Hide" : "Show"} the {count} general-practice notes
    </button>
  );
}

function NoteCard({
  entry,
  categories,
  byId,
  onAdd,
}: {
  entry: FiredNote;
  categories: Record<string, string>;
  byId: Map<string, AtelierMaterial>;
  onAdd: (material: AtelierMaterial) => void;
}) {
  const { note, kind, missing } = entry;
  const style = KIND_STYLE[kind];

  return (
    <li className="rounded-lg border border-[#f6ecdc]/10 bg-[#f6ecdc]/[0.03] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${style.className}`}
        >
          {style.label}
        </span>
        <span className="text-sm text-[#f6ecdc]">{note.title}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-[#f6ecdc]/30">
          {categories[note.category] ?? note.category}
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-[#f6ecdc]/60">{note.body}</p>

      {note.recipe.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {note.recipe.map((step) => {
            const material = byId.get(step.material);
            const have = !missing.includes(step.material);
            return (
              <li
                key={step.material}
                className={`text-[11px] tabular-nums ${have ? "text-[#f6ecdc]/70" : "text-[#f6ecdc]/40"}`}
              >
                {have && <span className="mr-1 text-[#c9963e]">✓</span>}
                {material?.name.split(" (")[0] ?? step.material}{" "}
                <span className="text-[#c9963e]">{step.pct}</span>
              </li>
            );
          })}
        </ul>
      )}

      {note.compare.length === 2 && note.compare_labels.length === 2 && (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {note.compare.map((id, i) => {
            // Mark the one already in the formula, so the comparison reads as
            // "here is what you chose and here is the alternative".
            const chosen = !missing.includes(id) && entry.matched.includes(id);
            return (
              <div
                key={id}
                className={`rounded-md border px-2.5 py-1.5 text-[11px] ${
                  chosen
                    ? "border-[#c9963e]/40 bg-[#c9963e]/[0.07] text-[#f6ecdc]/80"
                    : "border-[#f6ecdc]/10 text-[#f6ecdc]/50"
                }`}
              >
                {chosen && <span className="mr-1 text-[#c9963e]">✓</span>}
                {note.compare_labels[i]}
              </div>
            );
          })}
        </div>
      )}

      {Object.keys(note.dose).length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(note.dose).map(([id, dose]) => (
            <li key={id} className="text-[11px] text-[#f6ecdc]/45">
              {byId.get(id)?.name.split(" (")[0] ?? id}{" "}
              <span className="tabular-nums text-[#c9963e]">{dose}</span>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {missing.map((id) => {
            const material = byId.get(id);
            if (!material) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onAdd(material)}
                className="rounded-full border border-[#c9963e]/40 px-3 py-1 text-[11px] text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
              >
                + {material.name.split(" (")[0]}
              </button>
            );
          })}
        </div>
      )}

      {note.off_palette.length > 0 && (
        <p className="mt-2 text-[10px] text-[#f6ecdc]/30">
          Names {note.off_palette.join(", ")} — not in the palette.
        </p>
      )}
    </li>
  );
}
