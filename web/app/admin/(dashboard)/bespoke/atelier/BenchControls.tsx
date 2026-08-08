"use client";

/**
 * The things you do to a formula rather than to a material.
 *
 * Start from an existing accord, save a trial, come back to it, put the whole
 * thing in the right concentration, scale it to a target load, or undo the
 * removal you did not mean. None of this was possible before, and the absence
 * of the first and the second made the tool something you used once rather
 * than something you worked in.
 */

import { useState } from "react";

import { updateNotes, type SavedFormula } from "@/lib/bespoke/atelier-storage";

import { searchAccords, type AccordSummary } from "./actions";

/**
 * Compound as a share of the finished product. The neat percentages in the
 * formula are of the compound; IFRA limits are of the finished product; this
 * is the number that converts between them, and without it the safety panel
 * could only ever tell you to do the arithmetic yourself.
 */
export const DILUTIONS: { label: string; value: number; hint: string }[] = [
  { label: "Attar", value: 1, hint: "oil only, no alcohol — the compound is the product" },
  { label: "Extrait", value: 0.3, hint: "30% compound" },
  { label: "EDP", value: 0.2, hint: "20% compound" },
  { label: "EDT", value: 0.12, hint: "12% compound" },
  { label: "Cologne", value: 0.05, hint: "5% compound" },
];

export function BenchControls({
  neatLoad,
  dilution,
  onDilution,
  saved,
  onSave,
  onLoadSaved,
  onDeleteSaved,
  onLoadAccord,
  onScaleTo,
  onClear,
  canUndo,
  undoCount,
  onUndo,
  hasFormula,
}: {
  neatLoad: number;
  dilution: number;
  onDilution: (value: number) => void;
  saved: SavedFormula[];
  onSave: (name: string, notes: string) => void;
  onLoadSaved: (formula: SavedFormula) => void;
  onDeleteSaved: (id: string) => void;
  onLoadAccord: (id: string, name: string) => void;
  onScaleTo: (targetNeatLoad: number) => void;
  onClear: () => void;
  canUndo: boolean;
  /** How many materials the undo would restore, for an honest label. */
  undoCount: number;
  onUndo: () => void;
  hasFormula: boolean;
}) {
  const [drawer, setDrawer] = useState<"none" | "open" | "save">("none");
  const [accordQuery, setAccordQuery] = useState("");
  const [accordResults, setAccordResults] = useState<AccordSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [scaleTarget, setScaleTarget] = useState("25");

  async function runAccordSearch(value: string) {
    setAccordQuery(value);
    if (value.trim().length < 2) {
      setAccordResults([]);
      return;
    }
    setSearching(true);
    try {
      setAccordResults(await searchAccords(value));
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {/* ------------------------------------------------------ open/save */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDrawer(drawer === "open" ? "none" : "open")}
            aria-expanded={drawer === "open"}
            className="rounded-full border border-[#f6ecdc]/20 px-3.5 py-1.5 text-xs uppercase tracking-wide text-[#f6ecdc]/70 transition-colors hover:border-[#c9963e]/50 hover:text-[#c9963e]"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setDrawer(drawer === "save" ? "none" : "save")}
            aria-expanded={drawer === "save"}
            disabled={!hasFormula}
            className="rounded-full border border-[#f6ecdc]/20 px-3.5 py-1.5 text-xs uppercase tracking-wide text-[#f6ecdc]/70 transition-colors hover:border-[#c9963e]/50 hover:text-[#c9963e] disabled:opacity-30 disabled:hover:border-[#f6ecdc]/20 disabled:hover:text-[#f6ecdc]/70"
          >
            Save
          </button>
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              title={`Restores the whole formula as it was — ${undoCount} material${undoCount === 1 ? "" : "s"}. Anything added since then goes with it.`}
              className="rounded-full px-3 py-1.5 text-xs uppercase tracking-wide text-[#c9963e] transition-opacity hover:opacity-70"
            >
              ↩ Undo
            </button>
          )}
        </div>

        {/* ----------------------------------------------------- dilution */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/40">In the bottle</span>
          {DILUTIONS.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => onDilution(d.value)}
              title={d.hint}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                dilution === d.value
                  ? "bg-[#c9963e] font-semibold text-[#241510]"
                  : "text-[#f6ecdc]/50 hover:text-[#f6ecdc]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------- scale */}
        {hasFormula && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/40">Scale to</span>
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={scaleTarget}
              onChange={(e) => setScaleTarget(e.target.value)}
              aria-label="Target neat load percentage"
              className="w-16 rounded-md border border-[#f6ecdc]/20 bg-transparent px-2 py-1 text-right text-xs tabular-nums text-[#f6ecdc] outline-none focus:border-[#c9963e]"
            />
            <span className="text-xs text-[#f6ecdc]/40">%</span>
            <button
              type="button"
              onClick={() => {
                const target = Number(scaleTarget);
                if (Number.isFinite(target) && target > 0) onScaleTo(target);
              }}
              className="rounded-full border border-[#c9963e]/40 px-3 py-1 text-[11px] uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
            >
              Apply
            </button>
            <span className="text-[10px] tabular-nums text-[#f6ecdc]/30">
              now {neatLoad.toFixed(1)}%
            </span>
          </div>
        )}

        {hasFormula && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-[11px] uppercase tracking-wide text-[#f6ecdc]/30 transition-colors hover:text-[#e08080]"
          >
            Clear the bench
          </button>
        )}
      </div>

      {/* -------------------------------------------------------- drawers */}
      {drawer === "open" && (
        <div className="mt-4 border-t border-[#f6ecdc]/10 pt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
                Start from an accord
              </p>
              <p className="mt-0.5 text-[10px] text-[#f6ecdc]/30">
                All 1,081, searched on the server. Loading one replaces the bench.
              </p>
              <input
                type="text"
                value={accordQuery}
                onChange={(e) => void runAccordSearch(e.target.value)}
                placeholder="Search accords by name, note or family…"
                className="mt-2 w-full rounded-lg border border-[#f6ecdc]/20 bg-transparent px-3 py-2 text-sm text-[#f6ecdc] outline-none focus:border-[#c9963e]"
              />
              <ul className="mt-2 space-y-1">
                {searching && accordResults.length === 0 && (
                  <li className="px-1 py-1.5 text-xs text-[#f6ecdc]/35">searching…</li>
                )}
                {!searching && accordQuery.trim().length >= 2 && accordResults.length === 0 && (
                  <li className="px-1 py-1.5 text-xs text-[#f6ecdc]/35">No accord matches.</li>
                )}
                {accordResults.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onLoadAccord(a.id, a.name);
                        setDrawer("none");
                      }}
                      className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[#c9963e]/10"
                    >
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm text-[#f6ecdc]">{a.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/35">
                          {a.family} · {a.materialCount} materials · {a.neatLoadPct}%
                        </span>
                      </span>
                      {a.note && (
                        <span className="mt-0.5 block truncate text-[11px] text-[#f6ecdc]/45">
                          {a.note}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/50">
                Your saved trials
              </p>
              <p className="mt-0.5 text-[10px] text-[#f6ecdc]/30">
                Stored in this browser only — not on a server, and not on your other machine.
              </p>
              {saved.length === 0 ? (
                <p className="mt-2 text-xs text-[#f6ecdc]/35">Nothing saved yet.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {saved.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSaved(f);
                          setDrawer("none");
                        }}
                        className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[#c9963e]/10"
                      >
                        <span className="block truncate text-sm text-[#f6ecdc]">{f.name}</span>
                        <span className="text-[10px] text-[#f6ecdc]/35">
                          {f.rows.length} materials · saved {f.savedAt.slice(0, 16).replace("T", " ")} UTC
                        </span>
                        {f.notes && editingNotes !== f.id && (
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-[#f6ecdc]/55">
                            {f.notes}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNotes(editingNotes === f.id ? null : f.id)}
                        aria-label={`Edit notes on ${f.name}`}
                        title="What did it smell like?"
                        className="shrink-0 rounded px-2 py-1 text-xs text-[#f6ecdc]/30 transition-colors hover:text-[#c9963e]"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSaved(f.id)}
                        aria-label={`Delete ${f.name}`}
                        className="shrink-0 rounded px-2 py-1 text-xs text-[#f6ecdc]/30 transition-colors hover:text-[#e08080]"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {editingNotes && (
                <textarea
                  autoFocus
                  defaultValue={saved.find((f) => f.id === editingNotes)?.notes ?? ""}
                  onBlur={(e) => {
                    updateNotes(editingNotes, e.target.value);
                    setEditingNotes(null);
                  }}
                  rows={3}
                  placeholder="What did it smell like at four hours?"
                  className="mt-2 w-full rounded-lg border border-[#c9963e]/40 bg-transparent px-3 py-2 text-sm leading-relaxed text-[#f6ecdc] outline-none"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {drawer === "save" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f6ecdc]/10 pt-4">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && saveName.trim()) {
                onSave(saveName, saveNotes);
                setSaveName("");
                setSaveNotes("");
                setDrawer("none");
              }
            }}
            placeholder="Name this trial…"
            autoFocus
            className="min-w-[220px] flex-1 rounded-lg border border-[#f6ecdc]/20 bg-transparent px-3 py-2 text-sm text-[#f6ecdc] outline-none focus:border-[#c9963e]"
          />
          <button
            type="button"
            disabled={!saveName.trim()}
            onClick={() => {
              onSave(saveName, saveNotes);
              setSaveName("");
              setSaveNotes("");
              setDrawer("none");
            }}
            className="rounded-full bg-[#c9963e] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#241510] disabled:opacity-30"
          >
            Save
          </button>
          <textarea
            value={saveNotes}
            onChange={(e) => setSaveNotes(e.target.value)}
            rows={2}
            placeholder="What did it smell like? Too sharp at an hour, drydown too flat, the pepper wins…"
            className="w-full rounded-lg border border-[#f6ecdc]/20 bg-transparent px-3 py-2 text-sm leading-relaxed text-[#f6ecdc] outline-none focus:border-[#c9963e]"
          />
          <p className="w-full text-[10px] text-[#f6ecdc]/30">
            Saving under a name that already exists overwrites the formula and keeps the note.
            Version by naming — &ldquo;Rose 2&rdquo;, &ldquo;Rose 3&rdquo; — rather than by
            overwriting the one you want to compare against.
          </p>
        </div>
      )}
    </section>
  );
}
