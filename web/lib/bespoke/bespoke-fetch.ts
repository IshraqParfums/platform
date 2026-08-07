import 'server-only';

import { nestFetch, type NestFetchInit, type NestFetchResult } from '@/lib/api/nest';
import { getShopAccessToken } from '@/lib/auth/session';
import { getBespokeSessionToken } from '@/lib/bespoke/session-cookie';

/**
 * Nest calls for bespoke sessions: optional shop JWT + X-Bespoke-Session.
 */
export async function bespokeNestFetch<T>(
  path: string,
  init: Omit<NestFetchInit, 'accessToken'> = {},
): Promise<NestFetchResult<T>> {
  const accessToken = await getShopAccessToken();
  const sessionToken = await getBespokeSessionToken();
  const headers = new Headers(init.headers);
  if (sessionToken) {
    headers.set('X-Bespoke-Session', sessionToken);
  }
  return nestFetch<T>(path, { ...init, accessToken, headers });
}
