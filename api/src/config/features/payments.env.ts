import { EnvKeys } from '../env-keys';
import { missingKeys, readNonEmpty } from '../env-read';
import { FeatureUnavailableException } from '../feature-unavailable.exception';

export type PaymentsEnv = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

const REQUIRED = [
  EnvKeys.RAZORPAY_KEY_ID,
  EnvKeys.RAZORPAY_KEY_SECRET,
  EnvKeys.RAZORPAY_WEBHOOK_SECRET,
] as const;

export function resolvePaymentsEnv(
  env: NodeJS.ProcessEnv = process.env,
): PaymentsEnv {
  const missing = missingKeys(env, REQUIRED);
  if (missing.length > 0) {
    throw new FeatureUnavailableException(
      'payments',
      'Payments are temporarily unavailable.',
    );
  }

  return {
    keyId: readNonEmpty(env, EnvKeys.RAZORPAY_KEY_ID)!,
    keySecret: readNonEmpty(env, EnvKeys.RAZORPAY_KEY_SECRET)!,
    webhookSecret: readNonEmpty(env, EnvKeys.RAZORPAY_WEBHOOK_SECRET)!,
  };
}
