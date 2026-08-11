import type { AnswerRecord, EngineState } from '@ishraqparfums/bespoke-engine';
import { getNode, loadQuestions } from '@ishraqparfums/bespoke-engine';
import type { BespokeAnswerLogEntry } from '@ishraqparfums/shared';
import { nodeText } from './bespoke-node-sanitizer';

/**
 * `AnswerRecord.label` is the *chosen option's* own text (see engine.ts's
 * `applyAnswer` — `recordLabel = optionLabel(node.options, selectedIds)`),
 * not the question. The admin view previously tried to reconstruct a
 * question/answer pair from this shape on the web side, blind to the real
 * field meanings and with no graph to resolve `nodeId` against — it landed
 * on showing the answer's own label as if it were the question, and a
 * generic "Answered (single_select)" placeholder as the answer, because its
 * one check for a real answer (`record.type === "select"`) compared against
 * a literal that `AnswerRecord.type` never actually holds (it's
 * "single_select" / "multi_select" / etc., never the bare string "select").
 * Resolving both sides here, with the actual graph and the actual typed
 * record, replaces guessing with a lookup.
 */
function answerText(entry: AnswerRecord): string {
  if (entry.type === 'free_text') {
    return entry.text?.trim() || '(no answer)';
  }
  if (entry.type === 'name_entry') {
    const dedication = entry.dedication?.trim();
    return entry.perfumeName
      ? dedication
        ? `${entry.perfumeName} — ${dedication}`
        : entry.perfumeName
      : '(no answer)';
  }
  return entry.label?.trim() || '(no answer)';
}

/** Best-effort question text: a session answered on an older graph version
 *  may reference a node id that no longer exists, so fall back to the id
 *  itself rather than dropping the row. */
function questionText(nodeId: string): string {
  try {
    return nodeText(getNode(loadQuestions(), nodeId)) || nodeId;
  } catch {
    return nodeId;
  }
}

export function buildAdminAnswerLog(
  state: unknown,
): BespokeAnswerLogEntry[] {
  const answers = (state as EngineState | null)?.answers;
  if (!Array.isArray(answers)) return [];

  return answers.map((entry) => ({
    nodeId: entry.nodeId,
    questionText: questionText(entry.nodeId),
    answerText: answerText(entry),
  }));
}
