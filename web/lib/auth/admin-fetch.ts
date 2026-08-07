/**
 * Browser admin BFF fetch with session refresh.
 *
 * Refresh cookies are path-scoped to `/api/admin/auth` (see lib/auth/constants.ts),
 * so BFF routes cannot refresh themselves. On 401 this module:
 *   1. POST /api/admin/auth/refresh (single-flight across concurrent callers)
 *   2. Retries the original request once if refresh succeeds
 *
 * Use for authenticated admin BFF calls (`/api/admin/products/*`, orders, etc.).
 * Do NOT use for `/api/admin/auth/*` itself.
 * Request bodies must be rewindable (string / Blob), not one-shot streams.
 */

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the admin access cookie via the auth BFF.
 * Concurrent callers share one in-flight refresh.
 */
export function refreshAdminSessionClient(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch("/api/admin/auth/refresh", { method: "POST" });
      return response.ok;
    } catch {
      return false;
    }
  })();

  void refreshInFlight.finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * `fetch` for admin BFF routes. On 401, refreshes once then retries once.
 * Returns the original 401 Response when refresh fails.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;

  const refreshed = await refreshAdminSessionClient();
  if (!refreshed) return response;

  return fetch(input, init);
}
