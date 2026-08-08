import { EnvKeys } from '../env-keys';
import { missingKeys, readNonEmpty } from '../env-read';
import { FeatureUnavailableException } from '../feature-unavailable.exception';

export type OtpEnv = {
  pepper: string;
};

export function resolveOtpEnv(env: NodeJS.ProcessEnv = process.env): OtpEnv {
  const missing = missingKeys(env, [EnvKeys.OTP_PEPPER]);
  if (missing.length > 0) {
    throw new FeatureUnavailableException(
      'otp',
      'Sign-in is temporarily unavailable.',
    );
  }

  return { pepper: readNonEmpty(env, EnvKeys.OTP_PEPPER)! };
}
