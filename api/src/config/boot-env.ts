import { EnvKeys } from './env-keys';
import { missingKeys } from './env-read';

const BOOT_REQUIRED = [EnvKeys.DATABASE_URL, EnvKeys.JWT_SECRET] as const;

/**
 * Refuse to start without infrastructure secrets. Throws a plain Error for
 * boot logs — not an HTTP exception.
 */
export function assertBootEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = missingKeys(env, BOOT_REQUIRED);
  if (missing.length === 0) return;

  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'The API cannot start without DATABASE_URL and JWT_SECRET.',
  );
}
