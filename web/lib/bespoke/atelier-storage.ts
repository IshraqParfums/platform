/**
 * The bench remembers what you were doing.
 *
 * Until now the Atelier held its formula in component state and nothing else,
 * so a stray reload threw away an afternoon. There is still no database — the
 * submissions store is in-memory and resets on restart — but "no server to
 * save to" was never a reason to lose work on the same machine that made it.
 *
 * Two layers, deliberately:
 *
 *   the working formula   persisted on every edit, restored on load. You never
 *                         ask for this and you never think about it; it is
 *                         only noticed when it stops a disaster.
 *   named saves           explicit, listed, loadable. This is the one you
 *                         reach for when a trial is worth keeping and you want
 *                         to go and try something else.
 *
 * WHY THIS IS AN EXTERNAL STORE RATHER THAN useState + useEffect
 * --------------------------------------------------------------
 * The obvious shape — hold it in state, restore from localStorage in a mount
 * effect — needs a setState inside an effect, which React's compiler lint
 * rejects, and rightly: it means two sources of truth that have to be kept in
 * step, with a window on first paint where they disagree. So localStorage IS
 * the state, read through useSyncExternalStore. There is one copy, every
 * mutation persists by construction, and no effect has to reconcile anything.
 *
 * getSnapshot must return a stable reference between changes or React will
 * loop, so the parsed value is cached against the raw string and only reparsed
 * when that string actually differs.
 *
 * localStorage is per-browser and per-machine. That is stated in the UI rather
 * than implied, because a perfumer who thinks their formulas are on a server
 * will eventually lose them.
 */

import type { AtelierFormulaRow as FormulaRow } from "@ishraqparfums/shared";

const WORKING_KEY = "ishraq.atelier.working.v1";
const SAVED_KEY = "ishraq.atelier.saved.v1";

export interface WorkingState {
  rows: FormulaRow[];
  batchGrams: number;
  /** Share of the finished product that is compound, 0–1. */
  dilution: number;
}

export interface SavedFormula extends WorkingState {
  id: string;
  name: string;
  /** ISO timestamp, stored at save time — never computed during render. */
  savedAt: string;
  /**
   * What it actually smelled like.
   *
   * The bench loop is: build it, weigh it, smell it at four hours, change one
   * thing. Without somewhere to write down "too sharp at an hour, cut the
   * pink pepper" that last step happens in your head or on a scrap of paper,
   * and the saved formula is a set of numbers with no memory attached. This
   * is the field that makes a saved trial worth having.
   */
  notes: string;
}

/**
 * Frozen module constants. Both snapshots must return the SAME reference every
 * time when nothing has changed — a fresh object literal here would re-render
 * forever.
 */
const EMPTY_WORKING: WorkingState = Object.freeze({
  rows: Object.freeze([]) as unknown as FormulaRow[],
  batchGrams: 10,
  dilution: 0.2,
});
const EMPTY_SAVED: SavedFormula[] = Object.freeze([]) as unknown as SavedFormula[];

const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode, or the quota is full. Losing persistence is survivable;
    // taking the bench down with it is not.
  }
  notify();
}

/* ------------------------------------------------------- working formula */

let workingRaw: string | null | undefined;
let workingValue: WorkingState = EMPTY_WORKING;

export function getWorkingSnapshot(): WorkingState {
  const raw = readRaw(WORKING_KEY);
  if (raw === workingRaw) return workingValue;
  workingRaw = raw;
  workingValue = EMPTY_WORKING;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<WorkingState>;
      if (Array.isArray(parsed.rows)) {
        workingValue = {
          rows: parsed.rows.filter(
            (r): r is FormulaRow =>
              Boolean(r) && typeof r.materialId === "string" && typeof r.neatPct === "number",
          ),
          batchGrams: typeof parsed.batchGrams === "number" ? parsed.batchGrams : 10,
          dilution: typeof parsed.dilution === "number" ? parsed.dilution : 0.2,
        };
      }
    } catch {
      // A corrupt entry is not worth crashing the bench over — start clean.
    }
  }
  return workingValue;
}

/** Server and first-paint value. Constant, so hydration cannot mismatch. */
export function getWorkingServerSnapshot(): WorkingState {
  return EMPTY_WORKING;
}

export function setWorking(next: WorkingState): void {
  writeRaw(WORKING_KEY, next);
}

export function clearWorking(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WORKING_KEY);
  } catch {
    /* see writeRaw */
  }
  notify();
}

/* ----------------------------------------------------------- named saves */

let savedRaw: string | null | undefined;
let savedValue: SavedFormula[] = EMPTY_SAVED;

export function getSavedSnapshot(): SavedFormula[] {
  const raw = readRaw(SAVED_KEY);
  if (raw === savedRaw) return savedValue;
  savedRaw = raw;
  savedValue = EMPTY_SAVED;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SavedFormula[];
      if (Array.isArray(parsed)) {
        savedValue = parsed
          .filter((f) => f && typeof f.id === "string" && Array.isArray(f.rows))
          // `notes` postdates the first saves, so entries written before it
          // existed have to be given the field rather than left undefined.
          .map((f) => ({ ...f, notes: typeof f.notes === "string" ? f.notes : "" }));
      }
    } catch {
      /* see getWorkingSnapshot */
    }
  }
  return savedValue;
}

export function getSavedServerSnapshot(): SavedFormula[] {
  return EMPTY_SAVED;
}

/**
 * Save under a name. Saving twice under the same name overwrites rather than
 * accumulating near-identical entries — the list is for trials worth keeping,
 * not an edit history.
 */
export function saveFormula(name: string, state: WorkingState, notes = ""): void {
  const trimmed = name.trim() || "Untitled";
  const existing = getSavedSnapshot();
  const match = existing.find((f) => f.name.toLowerCase() === trimmed.toLowerCase());
  const entry: SavedFormula = {
    id: match?.id ?? `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    savedAt: new Date().toISOString(),
    // Keep any note already written against this name when overwriting.
    notes: notes || match?.notes || "",
    rows: state.rows.map((r) => ({ ...r })),
    batchGrams: state.batchGrams,
    dilution: state.dilution,
  };
  writeRaw(
    SAVED_KEY,
    match ? existing.map((f) => (f.id === match.id ? entry : f)) : [entry, ...existing],
  );
}

/** Edit the note on a saved trial without touching the formula or its date. */
export function updateNotes(id: string, notes: string): void {
  writeRaw(
    SAVED_KEY,
    getSavedSnapshot().map((f) => (f.id === id ? { ...f, notes } : f)),
  );
}

export function deleteFormula(id: string): void {
  writeRaw(SAVED_KEY, getSavedSnapshot().filter((f) => f.id !== id));
}
