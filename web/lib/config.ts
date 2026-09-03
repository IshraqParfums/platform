/**
 * Nest API origin for the Next BFF / server (no trailing slash).
 * Set `NEST_API_BASE_URL` in the environment; defaults to local Nest.
 * Production (Render): public API origin, no `/api/v1` suffix.
 */
export function getNestApiBaseUrl(): string {
  const raw = process.env.NEST_API_BASE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:3001';
}
