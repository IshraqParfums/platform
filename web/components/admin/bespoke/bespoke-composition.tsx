"use client";

import { useMemo, useState } from "react";
import {
  BESPOKE_DIMENSIONS,
  BESPOKE_DIMENSION_LABEL,
  BESPOKE_FAMILY_COLOR,
  type BespokeAnswerLogEntry,
  type BespokeFormulaSnapshotV1,
  type BespokeFormulaSnapshotV2,
} from "@ishraqparfums/shared";
import { FormulaTable } from "@/components/admin/bespoke/formula-table";
import { cn } from "@/lib/cn";

const DIMENSIONS = BESPOKE_DIMENSIONS;
const BATCH_MIN_G = 1;
const BATCH_MAX_G = 500;

function isV2(value: unknown): value is BespokeFormulaSnapshotV2 {
  return (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    (value as { schemaVersion: unknown }).schemaVersion === 2 &&
    "bottle" in value &&
    "sample" in value
  );
}

function isV1(value: unknown): value is BespokeFormulaSnapshotV1 {
  return (
    typeof value === "object" &&
    value !== null &&
    ("formula" in value || "perfumeName" in value) &&
    !isV2(value)
  );
}

function clampBatch(value: number, reference: number): number {
  if (!Number.isFinite(value) || value < BATCH_MIN_G) return reference;
  return Math.min(BATCH_MAX_G, Math.round(value));
}

export function BespokeComposition({
  formula,
  title,
  answerLog,
  className,
}: {
  formula: unknown;
  title?: string;
  answerLog?: BespokeAnswerLogEntry[];
  className?: string;
}) {
  if (isV2(formula)) {
    return (
      <CompositionV2
        formula={formula}
        title={title}
        answerLog={answerLog}
        className={className}
      />
    );
  }

  if (isV1(formula)) {
    return (
      <div className={cn("space-y-3 text-sm", className)}>
        <p className="font-mono text-label-sm uppercase text-ink-faint">
          Legacy v1 formula
        </p>
        {title ? (
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        ) : null}
        <p className="text-ink">{formula.perfumeName}</p>
        {formula.moodPara ? (
          <p className="text-ink-soft">{formula.moodPara}</p>
        ) : null}
        <pre className="scrollbar-brand overflow-x-auto rounded-md border border-ink/10 bg-ink/[0.03] p-3 text-xs text-ink-soft">
          {JSON.stringify(formula.formula ?? formula, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <p className={cn("text-sm text-ink-faint", className)}>
      No composition snapshot on this line.
    </p>
  );
}

function CompositionV2({
  formula,
  title,
  answerLog,
  className,
}: {
  formula: BespokeFormulaSnapshotV2;
  title?: string;
  answerLog?: BespokeAnswerLogEntry[];
  className?: string;
}) {
  const reference = formula.bottle.batch_g_reference || 10;
  const [batchG, setBatchG] = useState(reference);
  const [sheet, setSheet] = useState<"bottle" | "sample">("bottle");
  const scale = useMemo(() => batchG / reference, [batchG, reference]);
  const constraints = formula.constraintsSummary;
  const active = sheet === "bottle" ? formula.bottle : formula.sample;

  return (
    <div className={cn("space-y-6", className)}>
      {title ? (
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      ) : null}

      <section>
        <h4 className="font-mono text-label-sm uppercase text-ink-faint">
          Fingerprint
        </h4>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {DIMENSIONS.map((dim) => {
            const value = formula.fingerprint[dim] ?? 0;
            return (
              <li key={dim} className="rounded-md border border-ink/10 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: BESPOKE_FAMILY_COLOR[dim] }}
                  />
                  <span className="truncate text-xs text-ink-soft">
                    {BESPOKE_DIMENSION_LABEL[dim]}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm tabular-nums text-ink">
                  {value.toFixed(2)}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-faint">
          Patina {formula.modifiers.patina.toFixed(2)} · Moisture{" "}
          {formula.modifiers.moisture.toFixed(2)}
        </p>
      </section>

      <section>
        <h4 className="font-mono text-label-sm uppercase text-ink-faint">
          Constraints
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-ink-soft">
          {constraints.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
          {constraints.vetoMaterials.length > 0 ? (
            <li>Veto: {constraints.vetoMaterials.join(", ")}</li>
          ) : null}
          {constraints.boostMaterials.length > 0 ? (
            <li>Boost: {constraints.boostMaterials.join(", ")}</li>
          ) : null}
          {constraints.projection ? (
            <li>Projection: {constraints.projection}</li>
          ) : null}
          {constraints.notes.length === 0 &&
          constraints.vetoMaterials.length === 0 &&
          !constraints.projection ? (
            <li className="text-ink-faint">No hard constraints recorded.</li>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-ink-soft">
          Batch size (g)
          <input
            type="number"
            min={BATCH_MIN_G}
            max={BATCH_MAX_G}
            step={1}
            value={batchG}
            onChange={(e) =>
              setBatchG(clampBatch(Number(e.target.value), reference))
            }
            onBlur={() => setBatchG((v) => clampBatch(v, reference))}
            className="mt-1 block w-28 rounded-md border border-ink/15 bg-card px-2 py-1.5 text-ink"
          />
        </label>
        <p className="pb-2 text-xs text-ink-faint">
          {BATCH_MIN_G}–{BATCH_MAX_G} g · scales from the stored {reference} g
          reference.
        </p>
      </section>

      <section>
        <div className="flex flex-wrap gap-2">
          <SheetTab
            active={sheet === "bottle"}
            onClick={() => setSheet("bottle")}
            label={`Bottle · ${formula.bottle.name}`}
            hint="Full bottle the customer ordered"
          />
          <SheetTab
            active={sheet === "sample"}
            onClick={() => setSheet("sample")}
            label={`Sample · ${formula.sample.name}`}
            hint="Complimentary 2 ml divergent vial"
          />
        </div>

        <div className="mt-4 rounded-lg border border-ink/12 bg-card p-4">
          <p className="text-sm text-ink-soft">{active.inspiration}</p>
          {active.note_to_perfumer ? (
            <p className="mt-2 border-l-2 border-gold/40 pl-2 text-sm italic text-ink-soft">
              {active.note_to_perfumer}
            </p>
          ) : null}
          <FormulaTable
            lines={active.formula}
            neatLoadPct={active.neat_load_pct}
            batchReferenceG={active.batch_g_reference}
            scale={scale}
          />
        </div>
      </section>

      {answerLog && answerLog.length > 0 ? (
        <section>
          <h4 className="font-mono text-label-sm uppercase text-ink-faint">
            Answer log
          </h4>
          <ol className="mt-3 space-y-3">
            {answerLog.map((row, index) => (
              <li
                key={`${row.nodeId}-${index}`}
                className="rounded-lg border border-ink/10 bg-card px-4 py-3"
              >
                <p className="font-mono text-label-sm uppercase text-ink-faint">
                  {String(index + 1).padStart(2, "0")} · {row.questionText}
                  <span className="ml-2 text-ink-faint/60">({row.nodeId})</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  {row.answerText}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function SheetTab({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
        active
          ? "border-ink/25 bg-card"
          : "border-transparent bg-transparent hover:border-ink/15",
      )}
    >
      <span
        className={cn(
          "block font-display text-sm font-semibold",
          active ? "text-ink" : "text-ink-soft",
        )}
      >
        {label}
      </span>
      <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>
    </button>
  );
}
