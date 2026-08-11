import type { BespokePerfume } from '@prisma/client';
import type { Accord, EngineState } from '@ishraqparfums/bespoke-engine';
import {
  buildWhatIHeard,
  buildWhatIWillBuild,
  DIVERGENCE_FRAMING,
} from '@ishraqparfums/bespoke-engine';
import type {
  BespokeAdminListItem,
  BespokeColorTheme,
  BespokeFormulaSnapshotV2,
  BespokePerfumeAdminResponse,
  BespokePerfumeCustomerResponse,
} from '@ishraqparfums/shared';
import type { BespokePerfumeWithCustomer } from '../bespoke.repository';
import { buildAdminAnswerLog } from '../bespoke-answer-log.mapper';
import { customerCopyTier, isFormulaSnapshotV2 } from '../bespoke.helpers';

const NEUTRAL_THEME: BespokeColorTheme = {
  primary: null,
  secondary: null,
  accent: '#9C8FA0',
};

function colorTheme(row: BespokePerfume): BespokeColorTheme {
  const stored = row.colorThemeJson as unknown;
  if (typeof stored === 'object' && stored !== null && 'accent' in stored) {
    return stored as BespokeColorTheme;
  }
  return NEUTRAL_THEME;
}

/**
 * The reveal copy is not stored alongside the brew — it is regenerated from
 * the snapshot and the answer log, so a copy fix reaches brews that were
 * already made. Pre-v2 rows have neither, and degrade to an empty reveal
 * rather than failing the whole list.
 */
function reveal(row: BespokePerfume): { brief: string; whatIHeard: string } {
  const formula = row.formulaJson as unknown;
  const state = row.stateJson as unknown as EngineState | null;

  if (!isFormulaSnapshotV2(formula) || !state?.answers) {
    return { brief: '', whatIHeard: '' };
  }

  return {
    brief: buildWhatIWillBuild(
      formula.bottle as unknown as Accord,
      customerCopyTier(state),
    ),
    whatIHeard: buildWhatIHeard(state),
  };
}

export function toBespokePerfumeCustomerResponse(
  row: BespokePerfume,
): BespokePerfumeCustomerResponse {
  const theme = colorTheme(row);
  const { brief, whatIHeard } = reveal(row);

  return {
    id: row.id,
    name: row.name,
    dedication: row.dedication,
    engineVersion: row.engineVersion,
    graphVersion: row.graphVersion,
    colorTheme: theme,
    brief,
    whatIHeard,
    sampleFraming: DIVERGENCE_FRAMING,
    familyPrimary: theme.primary,
    familySecondary: theme.secondary,
    clientKey: row.clientKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBespokePerfumeAdminResponse(
  row: BespokePerfume,
): BespokePerfumeAdminResponse {
  return {
    id: row.id,
    name: row.name,
    dedication: row.dedication,
    customerId: row.customerId,
    engineVersion: row.engineVersion,
    graphVersion: row.graphVersion,
    formula: row.formulaJson as unknown as BespokeFormulaSnapshotV2,
    state: row.stateJson,
    answerLog: buildAdminAnswerLog(row.stateJson),
    colorTheme: colorTheme(row),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    clientKey: row.clientKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBespokeAdminListItem(
  row: BespokePerfumeWithCustomer,
): BespokeAdminListItem {
  const theme = colorTheme(row);
  const formula = row.formulaJson as unknown;
  const snapshot = isFormulaSnapshotV2(formula) ? formula : null;

  return {
    id: row.id,
    name: row.name,
    dedication: row.dedication,
    customerId: row.customerId,
    customerName: row.customer.name,
    customerPhone: row.customer.phone,
    engineVersion: row.engineVersion,
    graphVersion: row.graphVersion,
    colorTheme: theme,
    familyPrimary: theme.primary,
    familySecondary: theme.secondary,
    bottleName: snapshot?.bottle.name ?? null,
    sampleName: snapshot?.sample.name ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
