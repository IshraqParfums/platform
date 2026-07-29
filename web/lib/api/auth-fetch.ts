import 'server-only';

import { nestFetch, type NestFetchInit, type NestFetchResult } from '@/lib/api/nest';
import { getAdminAccessToken, getShopAccessToken } from '@/lib/auth/session';

type Role = 'shop' | 'admin';

/**
 * Attaches the role's access token and forwards to Nest. A 401 propagates
 * untouched so the route handler can return it to the browser.
 *
 * Refresh is deliberately NOT handled here. The refresh cookies are path-scoped
 * (see lib/auth/constants.ts), so they are only sent to /api/auth and
 * /api/admin/auth — a handler on any other path could never read one. Refresh is
 * orchestrated by the browser client against those two routes, where
 * single-flight dedupe is also correctly scoped to one user.
 */
async function authFetchWithRole<T>(
  role: Role,
  path: string,
  init: Omit<NestFetchInit, 'accessToken'> = {},
): Promise<NestFetchResult<T>> {
  const accessToken = await (role === 'shop'
    ? getShopAccessToken()
    : getAdminAccessToken());

  return nestFetch<T>(path, { ...init, accessToken });
}

/** Authenticated Nest calls for the shop (customer) session. */
export function shopAuthFetch<T>(
  path: string,
  init?: Omit<NestFetchInit, 'accessToken'>,
): Promise<NestFetchResult<T>> {
  return authFetchWithRole<T>('shop', path, init);
}

/** Authenticated Nest calls for the admin session. */
export function adminAuthFetch<T>(
  path: string,
  init?: Omit<NestFetchInit, 'accessToken'>,
): Promise<NestFetchResult<T>> {
  return authFetchWithRole<T>('admin', path, init);
}
