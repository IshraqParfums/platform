import { EnvKeys } from '../env-keys';
import { missingKeys, readNonEmpty } from '../env-read';
import { FeatureUnavailableException } from '../feature-unavailable.exception';

export type MediaEnv = {
  url: string;
  serviceRoleKey: string;
};

const REQUIRED = [
  EnvKeys.SUPABASE_URL,
  EnvKeys.SUPABASE_SERVICE_ROLE_KEY,
] as const;

export function resolveMediaEnv(env: NodeJS.ProcessEnv = process.env): MediaEnv {
  const missing = missingKeys(env, REQUIRED);
  if (missing.length > 0) {
    throw new FeatureUnavailableException(
      'media',
      'Image uploads are temporarily unavailable.',
    );
  }

  return {
    url: readNonEmpty(env, EnvKeys.SUPABASE_URL)!,
    serviceRoleKey: readNonEmpty(env, EnvKeys.SUPABASE_SERVICE_ROLE_KEY)!,
  };
}
