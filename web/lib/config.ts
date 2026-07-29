/**
 * Nest API origin (no trailing slash).
 * Prefer NEST_API_BASE_URL on the server; NEXT_PUBLIC_NEST_API_BASE_URL when
 * browser code must reach Nest directly (e.g. public health ping).
 */
export function getNestApiBaseUrl(): string {
  const raw =
    process.env.NEST_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_NEST_API_BASE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:3001';
}
