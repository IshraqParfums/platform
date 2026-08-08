import type { EnvKey } from './env-keys';

/** Non-empty trimmed value, or undefined when missing/blank. */
export function readNonEmpty(
  env: NodeJS.ProcessEnv,
  key: EnvKey,
): string | undefined {
  const raw = env[key]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

/**
 * Collect missing keys from a required set. Empty string counts as missing.
 */
export function missingKeys(
  env: NodeJS.ProcessEnv,
  keys: readonly EnvKey[],
): EnvKey[] {
  return keys.filter((key) => readNonEmpty(env, key) === undefined);
}
