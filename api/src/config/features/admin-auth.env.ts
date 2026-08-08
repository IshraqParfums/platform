import { EnvKeys } from '../env-keys';
import { missingKeys, readNonEmpty } from '../env-read';
import { FeatureUnavailableException } from '../feature-unavailable.exception';

export type AdminAuthEnv = {
  url: string;
  anonKey: string;
  jwtSecret: string;
};

const REQUIRED = [
  EnvKeys.SUPABASE_URL,
  EnvKeys.SUPABASE_ANON_KEY,
  EnvKeys.SUPABASE_JWT_SECRET,
] as const;

export function resolveAdminAuthEnv(
  env: NodeJS.ProcessEnv = process.env,
): AdminAuthEnv {
  const missing = missingKeys(env, REQUIRED);
  if (missing.length > 0) {
    throw new FeatureUnavailableException(
      'admin-auth',
      'Admin sign-in is temporarily unavailable.',
    );
  }

  return {
    url: readNonEmpty(env, EnvKeys.SUPABASE_URL)!,
    anonKey: readNonEmpty(env, EnvKeys.SUPABASE_ANON_KEY)!,
    jwtSecret: readNonEmpty(env, EnvKeys.SUPABASE_JWT_SECRET)!,
  };
}
