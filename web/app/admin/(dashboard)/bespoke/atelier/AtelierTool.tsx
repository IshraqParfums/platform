"use client";

/**
 * The bench tool: search the palette, dose what you pick, and watch what it
 * does over twenty-four hours.
 *
 * Everything shown is derived from data/materials.json's own numbers — the
 * curves from tenacity/evap_curve/strength (see lib/bespoke/volatility.ts),
 * the warnings from the same typical-range, ceiling, min-effective and
 * min-weighable checks scripts/generate_accords.py applies at build time.
 * Nothing here is a mock: if the tool says 0.03 g, that is what to weigh.
 *
 * State is deliberately local. There is no perfume table to save into yet
 * (the submissions store is in-memory and resets on restart), so rather than
 * pretend to persist, the formula copies out as JSON in the same shape
 * accords.json uses.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import {
  analyseCohesion,
  benchWarnings,
  buildImpression,
  buildVolatilityModel,
  dominantAt,
  doseRemedies,
  estimatedWearHours,
  findGaps,
  fireNotes,
  BESPOKE_FAMILY_PALETTE as FAMILY_PALETTE,
  onsetFloor,
  onsetPeakHours,
  pyramidSplit,
  rollUpConstituents,
  suggestBridges,
  suggestNext,
  suggestOpeners,
  type AffinityMaterial,
  type AtelierMaterial,
  type CataloguePerfume,
  type Constituent,
  type FacetLexicon,
  type FormulaRow,
  type TechniqueNote,
} from "@ishraqparfums/shared";
import {
  clearWorking,
  deleteFormula,
  getSavedServerSnapshot,
  getSavedSnapshot,
  getWorkingServerSnapshot,
  getWorkingSnapshot,
  saveFormula,
  setWorking,
  subscribe,
  type SavedFormula,
} from "@/lib/bespoke/atelier-storage";

import { loadAccord, type LoadedAccord } from "./actions";
import { BenchControls, DILUTIONS } from "./BenchControls";
import { BenchNotes } from "./BenchNotes";
import { CompareBar, type Pinned } from "./CompareBar";
import { ChemistryPanel } from "./ChemistryPanel";
import { ImpressionPanel } from "./ImpressionPanel";
import { MeldPanel } from "./MeldPanel";
import { NextMoves } from "./NextMoves";
import { buildColourMap, VolatilityChart } from "./VolatilityChart";

const BATCH_SIZES = [5, 10, 25, 50, 100];
/**
 * The moments worth naming when someone asks how a perfume behaves. The first
 * is genuinely t=0 — the instant of spraying, before anything heavy has had
 * time to lift — which is now a different picture from five minutes in.
 */
const READOUT_TIMES = [
  { hours: 0, label: "First spray" },
  { hours: 1, label: "1 hour" },
  { hours: 4, label: "4 hours" },
  { hours: 10, label: "10 hours" },
];

type AnalysisTab = "impression" | "meld" | "chemistry" | "notes" | "bench";

/** The order a formula is written and read. */
const TIER_ORDER = { top: 0, heart: 1, base: 2 } as const;

export function AtelierTool({
  materials,
  constituents,
  lexicon,
  techniqueNotes,
  noteCategories,
  catalogue,
  offeredAccord,
}: {
  materials: AtelierMaterial[];
  constituents: Constituent[];
  lexicon: FacetLexicon;
  techniqueNotes: TechniqueNote[];
  noteCategories: Record<string, string>;
  catalogue: CataloguePerfume[];
  /** Resolved from ?accord= on the server. Offered, never auto-applied. */
  offeredAccord: LoadedAccord | null;
}) {
  const byId = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  // localStorage is the state, not a copy of it — see atelier-storage.ts.
  // One source of truth means every edit persists by construction and no
  // effect has to reconcile anything on mount.
  const working = useSyncExternalStore(subscribe, getWorkingSnapshot, getWorkingServerSnapshot);
  const saved = useSyncExternalStore(subscribe, getSavedSnapshot, getSavedServerSnapshot);
  const { rows, batchGrams: batch, dilution } = working;

  const setRows = useCallback(
    (next: FormulaRow[] | ((current: FormulaRow[]) => FormulaRow[])) => {
      const current = getWorkingSnapshot();
      const value = typeof next === "function" ? next(current.rows) : next;
      setWorking({ ...current, rows: value });
    },
    [],
  );
  const setBatch = useCallback((grams: number) => {
    setWorking({ ...getWorkingSnapshot(), batchGrams: grams });
  }, []);
  const setDilution = useCallback((value: number) => {
    setWorking({ ...getWorkingSnapshot(), dilution: value });
  }, []);

  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sheetCopied, setSheetCopied] = useState(false);
  const [normalize, setNormalize] = useState(false);
  const [tab, setTab] = useState<AnalysisTab>("impression");
  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [pinned, setPinned] = useState<Pinned | null>(null);
  const [sortByTier, setSortByTier] = useState(true);
  /**
   * One step of undo, which covers the mistake that actually happens: a
   * remove, a clear, or loading over the top of unsaved work. Held in state
   * rather than a ref because the button reads its length during render, and
   * a ref read during render is exactly the impurity the compiler forbids.
   */
  const [undoSnapshot, setUndoSnapshot] = useState<FormulaRow[] | null>(null);

  const chosen = useMemo(() => new Set(rows.map((r) => r.materialId)), [rows]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return materials
      .filter((m) => {
        if (chosen.has(m.id)) return false;
        return (
          m.name.toLowerCase().includes(needle) ||
          m.id.includes(needle) ||
          m.odour.toLowerCase().includes(needle) ||
          m.facets.some((f) => f.toLowerCase().includes(needle)) ||
          Object.keys(m.families).some((f) => f.includes(needle)) ||
          m.notePosition.includes(needle)
        );
      })
      .slice(0, 8);
  }, [materials, query, chosen]);

  const model = useMemo(() => buildVolatilityModel(rows, byId), [rows, byId]);
  // One colour per material, shared by the chart, the table dots and the
  // readouts — so a swatch anywhere on the page means the same line.
  const colours = useMemo(
    () => buildColourMap(model.series.map((s) => s.material)),
    [model],
  );
  const neatLoad = rows.reduce((sum, r) => sum + r.neatPct, 0);
  const pyramid = useMemo(() => pyramidSplit(rows, byId), [rows, byId]);
  const warnings = useMemo(() => benchWarnings(rows, byId, batch), [rows, byId, batch]);
  const wearHours = model.series.length ? estimatedWearHours(model) : 0;
  /**
   * The IFRA comparison, done rather than described. A limit is a share of the
   * FINISHED product; the formula is in shares of the compound. Until the tool
   * knew the concentration it could only print both numbers and tell the
   * perfumer to divide — which is the kind of instruction that gets skipped.
   */
  const ifraChecks: IfraCheck[] = rows.flatMap((r) => {
    const m = byId.get(r.materialId);
    if (!m || m.ifraCat4Pct === null) return [];
    const inProduct = (r.neatPct / 100) * dilution * 100;
    return [{ material: m, neatPct: r.neatPct, inProduct, over: inProduct > m.ifraCat4Pct }];
  });
  const notAttarSafe = rows
    .map((r) => byId.get(r.materialId))
    .filter((m): m is AtelierMaterial => Boolean(m && !m.attarSafe));

  /* ------------------------------------------------------------ chemistry */
  // AtelierMaterial is a superset of AffinityMaterial, so the engine can take
  // the palette directly rather than us maintaining a parallel projection.
  const constituentsById = useMemo(
    () => new Map(constituents.map((c) => [c.id, c])),
    [constituents],
  );
  const pairsWith = useMemo(
    () => new Map(materials.map((m) => [m.id, new Set(m.pairsWith)])),
    [materials],
  );
  const formulaMaterials = useMemo(
    () => rows.map((r) => byId.get(r.materialId)).filter((m): m is AtelierMaterial => Boolean(m)),
    [rows, byId],
  );
  const cohesion = useMemo(
    () => analyseCohesion(formulaMaterials, lexicon, constituentsById, pairsWith),
    [formulaMaterials, lexicon, constituentsById, pairsWith],
  );
  const bridgeSuggestions = useMemo(
    () =>
      suggestBridges(
        formulaMaterials,
        materials as AffinityMaterial[],
        cohesion,
        lexicon,
        constituentsById,
        pairsWith,
      ),
    [formulaMaterials, materials, cohesion, lexicon, constituentsById, pairsWith],
  );
  const rollUp = useMemo(
    () => rollUpConstituents(rows, byId, constituentsById),
    [rows, byId, constituentsById],
  );
  const fired = useMemo(
    () => fireNotes(techniqueNotes, new Set(rows.map((r) => r.materialId))),
    [techniqueNotes, rows],
  );
  // The untriggered notes — structural advice true of nearly every formula.
  // Kept out of `fired` on purpose and offered behind a toggle instead.
  const generalNotes = useMemo(() => {
    const ids = new Set(rows.map((r) => r.materialId));
    const triggered = new Set(fired.map((f) => f.note.id));
    return fireNotes(techniqueNotes, ids, { includeUniversal: true }).filter(
      (f) => !triggered.has(f.note.id),
    );
  }, [techniqueNotes, rows, fired]);

  // A perfume is written top, then heart, then base — reading a formula in
  // the order the materials happened to be clicked makes it hard to see the
  // pyramid you are actually building. Insertion order stays available,
  // because while you are working "the one I just added" is also a real way
  // to find a row.
  const orderedRows = useMemo(() => {
    if (!sortByTier) return rows;
    return [...rows].sort((a, b) => {
      const ma = byId.get(a.materialId);
      const mb = byId.get(b.materialId);
      if (!ma || !mb) return 0;
      const tier = TIER_ORDER[ma.notePosition] - TIER_ORDER[mb.notePosition];
      // Within a tier, loudest first — that is the order a perfumer reads.
      return tier !== 0 ? tier : b.neatPct - a.neatPct;
    });
  }, [rows, byId, sortByTier]);

  /* -------------------------------------------------- what to add next */
  // The bench notes already name materials they want; folded in here as an
  // endorsement rather than a second list, so there is one place to look.
  const noteSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    // Highest-relevance note wins the attribution — fireNotes is already
    // sorted, so the first mention of a material is the best reason for it.
    for (const f of fired) {
      for (const id of f.missing) if (!map.has(id)) map.set(id, f.note.title);
    }
    return map;
  }, [fired]);
  const gaps = useMemo(() => findGaps(rows, byId, model), [rows, byId, model]);
  const remedies = useMemo(
    () => doseRemedies(gaps, rows, byId, model),
    [gaps, rows, byId, model],
  );
  const suggestions = useMemo(
    () =>
      rows.length === 0
        ? suggestOpeners(materials)
        : suggestNext(
            rows,
            byId,
            materials,
            model,
            gaps,
            lexicon,
            constituentsById,
            pairsWith,
            noteSuggestions,
          ),
    [rows, byId, materials, model, gaps, lexicon, constituentsById, pairsWith, noteSuggestions],
  );

  const impression = useMemo(
    () => buildImpression(rows, byId, model, lexicon, catalogue),
    [rows, byId, model, lexicon, catalogue],
  );

  function pinCurrent() {
    setPinned({
      label: loadedFrom ?? `${rows.length} materials at ${neatLoad.toFixed(1)}%`,
      rows: rows.map((r) => ({ ...r })),
      neatLoad,
      gapLabels: gaps.map((g) => g.label),
      wearHours,
    });
  }

  const seams = cohesion.orphans.length + Math.max(0, cohesion.clusters.length - 1);
  const TABS: { id: AnalysisTab; label: string; badge?: number }[] = [
    { id: "impression", label: "Impression" },
    { id: "meld", label: "Melding", badge: seams || undefined },
    { id: "chemistry", label: "Chemistry", badge: rollUp.totals.length || undefined },
    // Total fired, not just the actionable ones — the panel's own "N more
    // apply" footer counts the same set, and two different numbers for the
    // same list next to each other is worse than either alone.
    { id: "notes", label: "Bench notes", badge: fired.length || undefined },
    { id: "bench", label: "Safety", badge: warnings.length + ifraChecks.length || undefined },
  ];

  /** Snapshot before anything destructive, so one step of undo always exists. */
  const remember = useCallback((current: FormulaRow[]) => {
    setUndoSnapshot(current.map((r) => ({ ...r })));
  }, []);
  // One level, and it restores the whole formula rather than replaying a
  // single action — so anything added since the last removal goes too. Said
  // out loud on the button rather than left to be discovered.
  const canUndo = undoSnapshot !== null;
  const undoCount = undoSnapshot?.length ?? 0;

  function add(material: AtelierMaterial) {
    // Open at the middle of the material's own typical range rather than at
    // zero — a sensible first guess you then adjust, not a blank.
    const [lo, hi] = material.typicalRange;
    const opening = Math.round(((lo + hi) / 2) * 1000) / 1000;
    setRows((current) =>
      // The bridge cards and note cards can both offer the same material, and
      // a duplicate row would double its dose silently.
      current.some((r) => r.materialId === material.id)
        ? current
        : [...current, { materialId: material.id, neatPct: opening }],
    );
    setQuery("");
  }

  function setPct(materialId: string, neatPct: number) {
    setRows((current) =>
      current.map((r) => (r.materialId === materialId ? { ...r, neatPct: Math.max(0, neatPct) } : r)),
    );
  }

  function remove(materialId: string) {
    remember(rows);
    setRows((current) => current.filter((r) => r.materialId !== materialId));
  }

  function undo() {
    if (!undoSnapshot) return;
    setUndoSnapshot(null);
    setRows(undoSnapshot);
  }

  /** Scale every dose proportionally to hit a target neat load. */
  function scaleTo(target: number) {
    const current = rows.reduce((sum, r) => sum + r.neatPct, 0);
    if (current <= 0) return;
    remember(rows);
    const factor = target / current;
    setRows((rs) => rs.map((r) => ({ ...r, neatPct: Math.round(r.neatPct * factor * 1000) / 1000 })));
  }

  function clearBench() {
    remember(rows);
    setRows([]);
    setLoadedFrom(null);
    clearWorking();
  }

  async function openAccord(id: string, name: string) {
    const accord = await loadAccord(id);
    if (!accord) return;
    remember(rows);
    // Only materials the Atelier actually charts — solvents are filtered out
    // of the palette, and a row pointing at one would render as a blank line.
    setRows(accord.rows.filter((r) => byId.has(r.materialId)));
    setLoadedFrom(name);
  }

  function openSaved(formula: SavedFormula) {
    remember(rows);
    setWorking({
      rows: formula.rows.filter((r) => byId.has(r.materialId)),
      batchGrams: formula.batchGrams,
      dilution: formula.dilution,
    });
    setLoadedFrom(formula.name);
  }

  /**
   * The sheet you take to the scale.
   *
   * The JSON export is for another program; this is for a human holding a
   * pipette. Plain text, in weighing order, with the number to hit and a
   * running total to check against — which is how a formula is actually read
   * at the bench, and something the tool could not produce until now.
   */
  async function copyBenchSheet() {
    const label = DILUTIONS.find((d) => d.value === dilution)?.label ?? "custom";
    const width = Math.max(...orderedRows.map((r) => (byId.get(r.materialId)?.name ?? "").length), 8);
    const lines: string[] = [
      `${loadedFrom ?? "Untitled"} — ${batch} g batch, ${neatLoad.toFixed(2)}% neat load`,
      `Finished at ${label} (${Math.round(dilution * 100)}% compound)`,
      "",
      `${"MATERIAL".padEnd(width)}  ${"TIER".padEnd(5)}  ${"NEAT %".padStart(8)}  ${"WEIGH".padStart(9)}  RUNNING`,
    ];
    let running = 0;
    for (const row of orderedRows) {
      const m = byId.get(row.materialId);
      if (!m) continue;
      const grams = (row.neatPct / 100) * batch / m.stockDilution;
      running += grams;
      const at = m.stockDilution !== 1 ? ` @${Math.round(m.stockDilution * 100)}%` : "";
      lines.push(
        `${m.name.padEnd(width)}  ${m.notePosition.padEnd(5)}  ` +
          `${row.neatPct.toFixed(3).padStart(8)}  ${(grams.toFixed(3) + " g").padStart(9)}  ` +
          `${running.toFixed(3)} g${at}`,
      );
    }
    lines.push("", `Solvent to ${batch} g: ${Math.max(0, batch - running).toFixed(3)} g`);
    const flagged = ifraChecks.filter((c) => c.over);
    if (flagged.length > 0) {
      lines.push("", "OVER IFRA CAT 4 AT THIS CONCENTRATION:");
      for (const c of flagged) {
        lines.push(
          `  ${c.material.name} — ${c.inProduct.toFixed(4)}% of product vs ${c.material.ifraCat4Pct}% ceiling`,
        );
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setSheetCopied(true);
      setTimeout(() => setSheetCopied(false), 1800);
    } catch {
      setSheetCopied(false);
    }
  }

  async function copyFormula() {
    const payload = {
      neat_load_pct: Math.round(neatLoad * 1000) / 1000,
      batch_g_reference: batch,
      // The concentration the formula is destined for. Without it a reader
      // cannot check the IFRA numbers the tool just showed them, because
      // those are shares of the finished product and these are shares of the
      // compound.
      finished_product: {
        compound_pct: Math.round(dilution * 1000) / 10,
        label: DILUTIONS.find((d) => d.value === dilution)?.label ?? "custom",
      },
      // Exported in the order the table shows it — top, heart, base — so the
      // sheet you paste somewhere reads the same as the sheet you built.
      formula: orderedRows.map((r) => {
        const m = byId.get(r.materialId);
        return {
          material_id: r.materialId,
          material_name: m?.name ?? r.materialId,
          neat_pct: r.neatPct,
          note_position: m?.notePosition ?? null,
          today: {
            stock_dilution_pct: m ? Math.round(m.stockDilution * 10000) / 100 : 100,
            solvent: m?.solvent ?? null,
            grams_at_batch: m ? round4((r.neatPct / 100) * batch / m.stockDilution) : null,
          },
          later: { grams_neat_at_batch: round4((r.neatPct / 100) * batch) },
          in_finished_product_pct: round4((r.neatPct / 100) * dilution * 100),
        };
      }),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      {offeredAccord && !offerDismissed && loadedFrom !== offeredAccord.name && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c9963e]/30 bg-[#c9963e]/[0.06] px-4 py-3">
          <p className="min-w-0 flex-1 text-sm text-[#f6ecdc]/80">
            <span className="text-[#c9963e]">{offeredAccord.name}</span> is ready to open from the
            library — {offeredAccord.rows.length} materials.
            {rows.length > 0 && " Loading it replaces what is on the bench."}
          </p>
          <button
            type="button"
            onClick={() => {
              remember(rows);
              setRows(offeredAccord.rows.filter((r) => byId.has(r.materialId)));
              setLoadedFrom(offeredAccord.name);
            }}
            className="shrink-0 rounded-full bg-[#c9963e] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#241510]"
          >
            Load it
          </button>
          <button
            type="button"
            onClick={() => setOfferDismissed(true)}
            className="shrink-0 text-xs uppercase tracking-wide text-[#f6ecdc]/40 transition-colors hover:text-[#f6ecdc]"
          >
            Not now
          </button>
        </div>
      )}

      <BenchControls
        neatLoad={neatLoad}
        dilution={dilution}
        onDilution={setDilution}
        saved={saved}
        onSave={(name, notes) => saveFormula(name, { rows, batchGrams: batch, dilution }, notes)}
        onLoadSaved={openSaved}
        onDeleteSaved={deleteFormula}
        onLoadAccord={(id, name) => void openAccord(id, name)}
        onScaleTo={scaleTo}
        onClear={clearBench}
        canUndo={canUndo}
        undoCount={undoCount}
        onUndo={undo}
        hasFormula={rows.length > 0}
      />

      {/* ---------------------------------------------------------- search */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the palette — name, odour, facet, family, or tier…"
          className="w-full rounded-lg border border-[#f6ecdc]/20 bg-transparent px-4 py-3 text-[#f6ecdc] outline-none focus:border-[#c9963e]"
        />
        {query.trim() !== "" && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#f6ecdc]/15 bg-[#2c1b14] shadow-2xl">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[#f6ecdc]/45">Nothing in the palette matches.</p>
            ) : (
              results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => add(m)}
                  className="flex w-full items-start gap-3 border-b border-[#f6ecdc]/8 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-[#c9963e]/10"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: familyDot(m.primaryFamily) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-medium text-[#f6ecdc]">{m.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[#f6ecdc]/40">
                        {m.notePosition} · {m.tenacityHours}h · str {m.strength}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#f6ecdc]/50">{m.odour}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <NextMoves
        gaps={gaps}
        remedies={remedies}
        suggestions={suggestions}
        hasFormula={rows.length > 0}
        onAdd={add}
        onSetPct={setPct}
      />

      <CompareBar
        pinned={pinned}
        rows={rows}
        byId={byId}
        neatLoad={neatLoad}
        gaps={gaps}
        wearHours={wearHours}
        onPin={pinCurrent}
        onClear={() => setPinned(null)}
        onRestore={(previous) => {
          remember(rows);
          setRows(previous.map((r) => ({ ...r })));
        }}
      />

      {/* ----------------------------------------------------------- chart */}
      <section className="rounded-xl border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.03] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs uppercase tracking-wide text-[#f6ecdc]/50">How it behaves on skin</h2>
          <div className="flex flex-wrap items-center gap-3">
            {rows.length > 0 && (
              <p className="text-xs text-[#f6ecdc]/45">
                present for about <span className="text-[#c9963e]">{formatHours(wearHours)}</span>
              </p>
            )}
            <div className="flex items-center gap-1 rounded-full border border-[#f6ecdc]/12 p-0.5">
              {[
                { value: false, label: "Contribution" },
                { value: true, label: "Timing" },
              ].map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  onClick={() => setNormalize(mode.value)}
                  title={
                    mode.value
                      ? "Scale every line to its own peak — shows when each material arrives and fades, regardless of dose"
                      : "Scale every line to the blend — shows how loud each material reads, which is not the same as how much of it there is"
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors ${
                    normalize === mode.value
                      ? "bg-[#c9963e] font-semibold text-[#241510]"
                      : "text-[#f6ecdc]/45 hover:text-[#f6ecdc]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {rows.length === 0 ? (
          // A full-height empty grid was the largest thing on the page for
          // anyone arriving with nothing on the bench. The chart earns its
          // space once there is something to draw.
          <p className="py-10 text-center text-sm text-[#f6ecdc]/35">
            Add a material — or open an accord above — and its curve appears here.
          </p>
        ) : (
          <VolatilityChart model={model} colours={colours} highlightId={hovered} normalize={normalize} />
        )}
        {rows.length > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#f6ecdc]/35">
          Curves from each material&rsquo;s own strength, evaporation index, shape and tenacity. Lines
          start at different heights because materials do not all arrive at once, and where a line
          starts depends on two things: how fast it fills the air, and how little of it you need to
          smell. A quiet musk is genuinely absent for an hour; vanillin is heavy and potent, so it
          is there from the first second and still climbing.{" "}
          {normalize
            ? "Each line scaled to its own peak — read this for when things arrive and fade, not how loud they are."
            : "Height is perceived loudness, not dose: the nose follows roughly the square root of concentration, so twenty times the material is about four and a half times the smell. That is why Iso E can sit at 25% and Norlimbanol cannot sit at 1%."}{" "}
          A guide to timing, not a substitute for a blotter at four hours.
        </p>
        )}
      </section>

      {/* -------------------------------------------------------- readouts */}
      {rows.length > 0 && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {READOUT_TIMES.map((moment) => {
            const top = dominantAt(model, moment.hours, 3);
            return (
              <div
                key={moment.label}
                className="rounded-xl border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.03] px-3.5 py-3"
              >
                <p className="text-[11px] uppercase tracking-wide text-[#c9963e]">{moment.label}</p>
                {top.length === 0 ? (
                  <p className="mt-1.5 text-xs text-[#f6ecdc]/35">nothing left</p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {top.map((entry) => (
                      <li key={entry.material.id} className="flex items-center gap-1.5 text-xs">
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: colours.get(entry.material.id) }}
                        />
                        <span className="truncate text-[#f6ecdc]/80">{entry.material.name}</span>
                        <span className="ml-auto shrink-0 tabular-nums text-[#f6ecdc]/40">
                          {Math.round(entry.share * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* --------------------------------------------------------- formula */}
      <section className="rounded-xl border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs uppercase tracking-wide text-[#f6ecdc]/50">
            Formula — {rows.length} material{rows.length === 1 ? "" : "s"}
            {loadedFrom && (
              <span className="ml-2 normal-case tracking-normal text-[#c9963e]">
                from {loadedFrom}
              </span>
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setSortByTier((v) => !v)}
                title={
                  sortByTier
                    ? "Showing top, then heart, then base — the order a formula is written"
                    : "Showing the order you added them"
                }
                className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide text-[#f6ecdc]/45 transition-colors hover:text-[#c9963e]"
              >
                {sortByTier ? "By tier" : "As added"}
              </button>
            )}
            <span className="text-[11px] uppercase tracking-wide text-[#f6ecdc]/40">Batch</span>
            {BATCH_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBatch(size)}
                className={`rounded-full px-2.5 py-1 text-xs tabular-nums transition-colors ${
                  batch === size
                    ? "bg-[#c9963e] font-semibold text-[#241510]"
                    : "text-[#f6ecdc]/50 hover:text-[#f6ecdc]"
                }`}
              >
                {size}g
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 pb-2 text-center text-sm text-[#f6ecdc]/40">
            Search above to add your first material.
          </p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#f6ecdc]/15 text-left text-[11px] uppercase tracking-wide text-[#f6ecdc]/45">
                    <th className="py-2 pr-2 font-medium">Material</th>
                    <th className="py-2 pr-2 font-medium">Tier</th>
                    <th className="py-2 pr-2 text-right font-medium">Neat %</th>
                    <th className="py-2 pr-2 text-right font-medium">Weigh today</th>
                    <th className="py-2 pr-2 text-right font-medium">Neat later</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {orderedRows.map((row) => {
                    const m = byId.get(row.materialId);
                    if (!m) return null;
                    const today = (row.neatPct / 100) * batch / m.stockDilution;
                    const later = (row.neatPct / 100) * batch;
                    return (
                      <tr
                        key={row.materialId}
                        onMouseEnter={() => setHovered(row.materialId)}
                        onMouseLeave={() => setHovered(null)}
                        className="border-b border-[#f6ecdc]/8 transition-colors hover:bg-[#f6ecdc]/[0.04]"
                      >
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: colours.get(m.id) }}
                            />
                            <span className="text-[#f6ecdc]">{m.name}</span>
                          </span>
                          <span
                            className="mt-0.5 block text-[10px] uppercase tracking-wide text-[#f6ecdc]/35"
                            title={`Evaporation index ${m.evapIndex}, strength ${m.strength}. Starts at ${Math.round(onsetFloor(m) * 100)}% of its own peak because a material this heavy is still filling the air, and this potent is already over the threshold.`}
                          >
                            str {m.strength} · starts {Math.round(onsetFloor(m) * 100)}% · peaks{" "}
                            {peakLabel(m)} · gone by {m.tenacityHours}h · {m.evapCurve}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-[11px] uppercase tracking-wide text-[#f6ecdc]/45">
                          {m.notePosition}
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={0.001}
                            value={row.neatPct}
                            onChange={(e) => setPct(row.materialId, Number(e.target.value))}
                            aria-label={`${m.name} percentage`}
                            className="w-24 rounded-md border border-[#f6ecdc]/20 bg-transparent px-2 py-1 text-right tabular-nums text-[#f6ecdc] outline-none focus:border-[#c9963e]"
                          />
                          <span className="mt-0.5 block text-[10px] tabular-nums text-[#f6ecdc]/30">
                            usual {m.typicalRange[0]}–{m.typicalRange[1]}%
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums text-[#f6ecdc]/80">
                          {today.toFixed(3)} g
                          {m.stockDilution !== 1 && (
                            <span className="text-[#f6ecdc]/40">
                              {" "}
                              @{Math.round(m.stockDilution * 100)}%
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums text-[#f6ecdc]/60">
                          {later.toFixed(3)} g
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => remove(row.materialId)}
                            aria-label={`Remove ${m.name}`}
                            className="rounded px-2 py-1 text-xs text-[#f6ecdc]/35 transition-colors hover:text-[#e08080]"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f6ecdc]/10 pt-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-[#f6ecdc]/45">
                  neat load{" "}
                  <span className={neatLoad > 35 ? "text-[#e0a060]" : "text-[#f6ecdc]/80"}>
                    {neatLoad.toFixed(2)}%
                  </span>
                </span>
                <PyramidBar pyramid={pyramid} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyBenchSheet}
                  title="Plain text, in weighing order, with a running total — for a human at the scale"
                  className="rounded-full bg-[#c9963e] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#241510] transition-opacity hover:opacity-90"
                >
                  {sheetCopied ? "Copied" : "Copy bench sheet"}
                </button>
                <button
                  type="button"
                  onClick={copyFormula}
                  title="Structured JSON in the shape accords.json uses — for another program"
                  className="rounded-full border border-[#c9963e]/40 px-4 py-1.5 text-xs uppercase tracking-wide text-[#c9963e] transition-colors hover:bg-[#c9963e]/10"
                >
                  {copied ? "Copied" : "JSON"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* -------------------------------------------------------- analysis */}
      <section className="rounded-xl border border-[#f6ecdc]/12 bg-[#f6ecdc]/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-1 border-b border-[#f6ecdc]/10 pb-3">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              aria-current={tab === entry.id ? "true" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition-colors ${
                tab === entry.id
                  ? "bg-[#c9963e] font-semibold text-[#241510]"
                  : "text-[#f6ecdc]/45 hover:bg-[#f6ecdc]/5 hover:text-[#f6ecdc]"
              }`}
            >
              {entry.label}
              {entry.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                    tab === entry.id ? "bg-[#241510]/20" : "bg-[#f6ecdc]/10"
                  }`}
                >
                  {entry.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {tab === "impression" && (
            <ImpressionPanel
              impression={impression}
              lexicon={lexicon}
              colours={colours}
              hasFormula={rows.length > 0}
            />
          )}
          {tab === "meld" && (
            <MeldPanel
              formula={formulaMaterials}
              report={cohesion}
              bridges={bridgeSuggestions}
              lexicon={lexicon}
              constituentsById={constituentsById}
              pairsWith={pairsWith}
              colours={colours}
              byId={byId}
              onAdd={add}
            />
          )}
          {tab === "chemistry" && (
            <ChemistryPanel
              totals={rollUp.totals}
              undisclosedPct={rollUp.undisclosedPct}
              neatLoad={neatLoad}
              rows={rows}
              byId={byId}
              colours={colours}
            />
          )}
          {tab === "notes" && (
            <BenchNotes
              fired={fired}
              general={generalNotes}
              categories={noteCategories}
              byId={byId}
              onAdd={add}
            />
          )}
          {tab === "bench" && (
            <SafetyPanel {...{ warnings, notAttarSafe, ifraChecks, dilution }} />
          )}
        </div>
      </section>
    </div>
  );
}

interface IfraCheck {
  material: AtelierMaterial;
  neatPct: number;
  /** The dose as a share of the finished product, after dilution. */
  inProduct: number;
  over: boolean;
}

function SafetyPanel({
  warnings,
  notAttarSafe,
  ifraChecks,
  dilution,
}: {
  warnings: ReturnType<typeof benchWarnings>;
  notAttarSafe: AtelierMaterial[];
  ifraChecks: IfraCheck[];
  dilution: number;
}) {
  if (warnings.length === 0 && ifraChecks.length === 0 && notAttarSafe.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#f6ecdc]/40">
        Nothing flagged. Every dose is inside its material&rsquo;s own range and weighable at this
        batch size.
      </p>
    );
  }
  return (
    <>
      <ul className="space-y-2 text-xs">
            {warnings.map((warning, i) => (
              <li key={`${warning.materialId}-${i}`} className="flex gap-2 leading-relaxed">
                <span className={warning.severity === "warn" ? "text-[#e0a060]" : "text-[#f6ecdc]/35"}>
                  {warning.severity === "warn" ? "⚠" : "·"}
                </span>
                <span className="text-[#f6ecdc]/65">
                  <span className="text-[#f6ecdc]/85">{warning.materialName}</span> — {warning.message}
                </span>
              </li>
            ))}
            {notAttarSafe.map((m) => (
              <li key={`attar-${m.id}`} className="flex gap-2 leading-relaxed">
                <span className="text-[#e0a060]">⚠</span>
                <span className="text-[#f6ecdc]/65">
                  <span className="text-[#f6ecdc]/85">{m.name}</span> — not attar-safe; fine in alcohol,
                  not in an oil-only build.
                </span>
              </li>
            ))}
            {ifraChecks.map((check) => (
              <li key={`ifra-${check.material.id}`} className="flex gap-2 leading-relaxed">
                <span className={check.over ? "text-[#e0a060]" : "text-[#f6ecdc]/35"}>
                  {check.over ? "⚠" : "·"}
                </span>
                <span className="text-[#f6ecdc]/65">
                  <span className="text-[#f6ecdc]/85">{check.material.name}</span> —{" "}
                  <span className="tabular-nums">{check.neatPct}%</span> of the compound at{" "}
                  {Math.round(dilution * 100)}% is{" "}
                  <span className={check.over ? "text-[#e0a060]" : "text-[#c9963e]"}>
                    {check.inProduct.toFixed(4)}%
                  </span>{" "}
                  of the finished product, against an IFRA Cat 4 ceiling of{" "}
                  <span className="text-[#c9963e]">{check.material.ifraCat4Pct}%</span>
                  {check.over
                    ? ` — over by ${(check.inProduct / (check.material.ifraCat4Pct ?? 1)).toFixed(1)}×.`
                    : ` — ${Math.round((check.inProduct / (check.material.ifraCat4Pct ?? 1)) * 100)}% of the way there.`}{" "}
                  <span className="text-[#f6ecdc]/45">{check.material.ifraNote}</span>
                </span>
              </li>
            ))}
          </ul>
      {ifraChecks.length > 0 && (
        <p className="mt-3 border-t border-[#f6ecdc]/8 pt-2 text-[11px] leading-relaxed text-[#f6ecdc]/35">
          Computed at the concentration set above. These are working approximations for
          formulation, not a compliance report — verify against the current amendment before any
          commercial batch.
        </p>
      )}
    </>
  );
}

function PyramidBar({ pyramid }: { pyramid: { top: number; heart: number; base: number } }) {
  const tiers: [string, number, string][] = [
    ["top", pyramid.top, FAMILY_PALETTE.citrus.accent],
    ["heart", pyramid.heart, FAMILY_PALETTE.floral.accent],
    ["base", pyramid.base, FAMILY_PALETTE.woody.accent],
  ];
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-2 w-28 overflow-hidden rounded-full bg-[#f6ecdc]/10">
        {tiers.map(([name, value, colour]) => (
          <span key={name} style={{ width: `${value}%`, background: colour }} />
        ))}
      </span>
      <span className="tabular-nums text-[#f6ecdc]/45">
        {tiers.map(([name, value]) => `${name[0].toUpperCase()}${Math.round(value)}`).join(" · ")}
      </span>
    </span>
  );
}

/**
 * The swatch in the search dropdown. A material that isn't in the formula
 * yet has no line to match, so this shows its plain family colour — the
 * per-material variant only exists once it's charted alongside its siblings.
 */
function familyDot(family: string | null): string {
  if (family && family in FAMILY_PALETTE) {
    return FAMILY_PALETTE[family as keyof typeof FAMILY_PALETTE].accent;
  }
  return "#9C8FA0";
}

/**
 * When this material is at its loudest. Worth stating as a number next to the
 * dose: it is the difference between six drops of pink pepper (there before
 * you have capped the bottle) and six drops of agarwood (still building at
 * three hours), which the old curves drew as the same opening.
 */
function peakLabel(material: AtelierMaterial): string {
  const hours = onsetPeakHours(material);
  if (hours < 1 / 60) return "instantly";
  if (hours < 1) return `~${Math.round(hours * 60)}m`;
  return `~${hours < 10 ? hours.toFixed(1) : Math.round(hours)}h`;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours >= 24) return "24 hours or more";
  return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} hours`;
}
