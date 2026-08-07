import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type {
  Accord,
  Constraints,
  EngineState,
  Fingerprint,
} from '@ishraqparfums/bespoke-engine';
import {
  dominantDimension,
  FAMILY_COLOR,
  secondaryDimension,
} from '@ishraqparfums/bespoke-engine';
import type {
  BespokeAccordSnapshot,
  BespokeColorTheme,
  BespokeConstraintsSummary,
  BespokeFormulaSnapshotV2,
} from '@ishraqparfums/shared';

/** Used when a fingerprint is flat enough to have no dominant family at all. */
const NEUTRAL_ACCENT = '#9C8FA0';

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Constant-time comparison of two same-length hex digests. */
export function hexDigestsMatch(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) {
    return false;
  }

  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');

  if (left.length === 0 || left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function hashIp(ip: string | null | undefined): string | null {
  const trimmed = ip?.trim();
  return trimmed ? sha256Hex(trimmed) : null;
}

export function toColorTheme(vector: Fingerprint): BespokeColorTheme {
  const primary = dominantDimension(vector);
  const secondary = secondaryDimension(vector);

  return {
    primary,
    secondary,
    accent: primary ? FAMILY_COLOR[primary] : NEUTRAL_ACCENT,
  };
}

/**
 * The accord as it is stored on a brew: everything the bench needs, minus
 * `source`/`composite`, which describe where the accord came from in the
 * authoring pipeline rather than what to weigh out.
 */
export function toAccordSnapshot(accord: Accord): BespokeAccordSnapshot {
  return {
    id: accord.id,
    name: accord.name,
    inspiration: accord.inspiration,
    vector: accord.vector,
    modifiers: accord.modifiers,
    family_cluster: accord.family_cluster,
    note_to_perfumer: accord.note_to_perfumer,
    formula: accord.formula,
    neat_load_pct: accord.neat_load_pct,
    attar_safe: accord.attar_safe,
    ifra_verify_materials: accord.ifra_verify_materials,
    batch_g_reference: accord.batch_g_reference,
  };
}

/** The subset of accumulated constraints a production sheet needs to read. */
export function toConstraintsSummary(
  constraints: Constraints,
): BespokeConstraintsSummary {
  return {
    vetoMaterials: constraints.vetoMaterials,
    capMaterials: constraints.capMaterials,
    capFamilies: constraints.capFamilies,
    capPatina: constraints.capPatina,
    boostMaterials: constraints.boostMaterials,
    notes: constraints.notes,
    projection: constraints.projection,
  };
}

export function buildFormulaSnapshot(
  state: EngineState,
  bottle: Accord,
  sample: Accord,
): BespokeFormulaSnapshotV2 {
  return {
    schemaVersion: 2,
    bottle: toAccordSnapshot(bottle),
    sample: toAccordSnapshot(sample),
    fingerprint: state.fingerprint,
    modifiers: state.modifiers,
    constraintsSummary: toConstraintsSummary(state.constraints),
    colorTheme: toColorTheme(bottle.vector),
  };
}

export function isFormulaSnapshotV2(
  value: unknown,
): value is BespokeFormulaSnapshotV2 {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === 2
  );
}

/**
 * Every customer-facing reveal is written at "enthusiast" depth at most:
 * the perfumer tier adds `note_to_perfumer` verbatim, which is bench
 * language and never leaves the admin sheet.
 */
export function customerCopyTier(
  state: Pick<EngineState, 'fluencyTier'>,
): 'lover' | 'enthusiast' {
  return state.fluencyTier === 'lover' ? 'lover' : 'enthusiast';
}
