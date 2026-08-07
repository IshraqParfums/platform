import type { BespokeAnswerLogRow } from "@/components/admin/bespoke/bespoke-composition";

/**
 * Turn engine session `state.answers` (or similar) into human admin rows.
 * Tolerates several shape variants without depending on engine types.
 */
export function formatBespokeAnswerLog(state: unknown): BespokeAnswerLogRow[] | undefined {
  if (!state || typeof state !== "object") return undefined;

  const candidates = [
    (state as { answers?: unknown }).answers,
    (state as { answer_log?: unknown }).answer_log,
    (state as { history?: unknown }).history,
  ];

  const answers = candidates.find((value) => Array.isArray(value));
  if (!Array.isArray(answers) || answers.length === 0) return undefined;

  const rows: BespokeAnswerLogRow[] = [];

  for (const entry of answers) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const nodeId = stringField(record, "nodeId") ?? stringField(record, "node_id");
    if (!nodeId) continue;

    const label =
      stringField(record, "label") ??
      stringField(record, "nodeText") ??
      stringField(record, "node_text") ??
      stringField(record, "question");

    const summary = humanizeAnswer(record);
    rows.push({ nodeId, label: label ?? undefined, summary });
  }

  return rows.length > 0 ? rows : undefined;
}

function stringField(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function humanizeAnswer(record: Record<string, unknown>): string {
  if (typeof record.summary === "string" && record.summary.trim()) {
    return record.summary.trim();
  }

  const answer = record.answer;
  if (typeof answer === "string" && answer.trim()) return answer.trim();

  if (answer && typeof answer === "object") {
    const a = answer as Record<string, unknown>;
    if (typeof a.text === "string" && a.text.trim()) return a.text.trim();
    if (typeof a.perfumeName === "string") {
      const dedication =
        typeof a.dedication === "string" && a.dedication.trim()
          ? ` — ${a.dedication.trim()}`
          : "";
      return `${a.perfumeName}${dedication}`;
    }
    if (Array.isArray(a.optionIds) && a.optionIds.length > 0) {
      if (Array.isArray(a.labels) && a.labels.every((x) => typeof x === "string")) {
        return (a.labels as string[]).join(", ");
      }
      return `Selected ${a.optionIds.length} option${a.optionIds.length === 1 ? "" : "s"}`;
    }
    if (typeof a.accordId === "string") return `Chose candidate ${a.accordId}`;
    if (typeof a.perfumeName === "string" || a.perfumeId != null) {
      return typeof a.perfumeName === "string"
        ? a.perfumeName
        : "Catalogue reference";
    }
  }

  if (Array.isArray(record.optionIds)) {
    if (Array.isArray(record.labels)) {
      return (record.labels as unknown[])
        .filter((x): x is string => typeof x === "string")
        .join(", ");
    }
    const labels = Array.isArray(record.options)
      ? (record.options as unknown[])
          .map((opt) =>
            opt && typeof opt === "object"
              ? stringField(opt as Record<string, unknown>, "label")
              : null,
          )
          .filter((x): x is string => Boolean(x))
      : [];
    if (labels.length) return labels.join(", ");
  }

  if (typeof record.label === "string" && record.type === "select") {
    return record.label;
  }

  // Last resort: compact key summary, never raw dump of the whole object.
  const kind =
    answer && typeof answer === "object"
      ? stringField(answer as Record<string, unknown>, "kind")
      : stringField(record, "kind") ?? stringField(record, "type");
  return kind ? `Answered (${kind})` : "Answered";
}
