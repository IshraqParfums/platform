/**
 * Browser shop BFF fetch with session refresh.
 *
 * Refresh cookies are path-scoped to `/api/auth` (see lib/auth/constants.ts),
 * so BFF routes cannot refresh themselves. On 401 this module:
 *   1. POST /api/auth/refresh (single-flight across concurrent callers)
 *   2. Retries the original request once if refresh succeeds
 *
 * Use for authenticated shop BFF calls (`/api/cart/*`, later account/orders).
 * Do NOT use for `/api/auth/*` itself.
 * Request bodies must be rewindable (string / Blob), not one-shot streams.
 */

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the shop access cookie via the auth BFF.
 * Concurrent callers share one in-flight refresh.
 */
export function refreshShopSessionClient(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST" });
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
 * `fetch` for shop BFF routes. On 401, refreshes once then retries once.
 * Returns the original 401 Response when refresh fails.
 */
export async function shopFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;

  const refreshed = await refreshShopSessionClient();
  if (!refreshed) return response;

  return fetch(input, init);
}
