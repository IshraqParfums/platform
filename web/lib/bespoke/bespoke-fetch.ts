import "server-only";

import {
  nestFetch,
  type NestFetchInit,
  type NestFetchResult,
} from "@/lib/api/nest";
import { getShopAccessToken } from "@/lib/auth/session";
import { getBespokeSessionTokenFor } from "@/lib/bespoke/session-cookie";

export type BespokeNestFetchInit = Omit<NestFetchInit, "accessToken"> & {
  /** When set, attaches that session's token as X-Bespoke-Session. */
  sessionId?: string;
};

/**
 * Nest calls for bespoke sessions: optional shop JWT + X-Bespoke-Session.
 */
export async function bespokeNestFetch<T>(
  path: string,
  init: BespokeNestFetchInit = {},
): Promise<NestFetchResult<T>> {
  const { sessionId, ...rest } = init;
  const accessToken = await getShopAccessToken();
  const headers = new Headers(rest.headers);
  if (sessionId) {
    const sessionToken = await getBespokeSessionTokenFor(sessionId);
    if (sessionToken) {
      headers.set("X-Bespoke-Session", sessionToken);
    }
  }
  return nestFetch<T>(path, { ...rest, accessToken, headers });
}
