/**
 * Resolve a client IP for abuse counters (never for authorization).
 *
 * When TRUST_PROXY is enabled, Express `@Ip()` already reflects the
 * left-most forwarded hop. Otherwise ignore X-Forwarded-For so clients
 * cannot spoof the rate-limit key.
 */
export function resolveClientIp(input: {
  expressIp: string;
  forwardedFor?: string;
  trustProxy: boolean;
}): string {
  if (input.trustProxy) {
    return input.expressIp;
  }
  void input.forwardedFor;
  return input.expressIp;
}

export function isTrustProxyEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env.TRUST_PROXY?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
