import type { BespokePerfume } from '@prisma/client';
import type {
  BespokeAnswerEntry,
  BespokeFormulaSnapshot,
  BespokePerfumeResponse,
  BespokeResult,
} from '@ishraqparfums/shared';

export function toBespokePerfumeResponse(
  row: BespokePerfume,
): BespokePerfumeResponse {
  const formula = row.formulaJson as unknown as BespokeFormulaSnapshot;
  const answers = row.answersJson as unknown as BespokeAnswerEntry[];
  const why = row.whyJson as unknown as string[];
  const inspired =
    (row.inspiredJson as unknown as BespokeResult['inspired'] | null) ?? [];

  return {
    id: row.id,
    name: row.name,
    formula,
    answers,
    moodText: row.moodText,
    why,
    inspired,
    engineVersion: row.engineVersion,
    clientKey: row.clientKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
