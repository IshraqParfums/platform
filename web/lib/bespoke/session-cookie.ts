import "server-only";

import { cookies } from "next/headers";
import {
  BESPOKE_SESSION_COOKIE,
  BESPOKE_SESSION_MAX_AGE_SECONDS,
} from "@/lib/bespoke/constants";
import {
  getSessionTokenFromStore,
  listSessionIds,
  parseSessionCookieStore,
  removeSessionToken,
  serializeSessionCookieStore,
  upsertSessionToken,
} from "@/lib/bespoke/session-cookie-store";

async function readRaw(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(BESPOKE_SESSION_COOKIE)?.value;
}

async function writeRaw(value: string): Promise<void> {
  const jar = await cookies();
  jar.set(BESPOKE_SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BESPOKE_SESSION_MAX_AGE_SECONDS,
  });
}

export async function putBespokeSessionToken(
  sessionId: string,
  token: string,
): Promise<void> {
  const { store } = parseSessionCookieStore(await readRaw());
  await writeRaw(
    serializeSessionCookieStore(upsertSessionToken(store, sessionId, token)),
  );
}

export async function getBespokeSessionTokenFor(
  sessionId: string,
): Promise<string | undefined> {
  const { store, legacyToken } = parseSessionCookieStore(await readRaw());
  return getSessionTokenFromStore(store, sessionId, legacyToken);
}

export async function removeBespokeSessionToken(
  sessionId: string,
): Promise<void> {
  const { store } = parseSessionCookieStore(await readRaw());
  const next = removeSessionToken(store, sessionId);
  if (next.entries.length === 0) {
    const jar = await cookies();
    jar.delete(BESPOKE_SESSION_COOKIE);
    return;
  }
  await writeRaw(serializeSessionCookieStore(next));
}

export async function clearAllBespokeSessionTokens(): Promise<void> {
  const jar = await cookies();
  jar.delete(BESPOKE_SESSION_COOKIE);
}

/** Known session ids on this device, newest first. */
export async function listBespokeSessionIds(): Promise<string[]> {
  const { store } = parseSessionCookieStore(await readRaw());
  return listSessionIds(store);
}

/** Raw session tokens on this device — BFF injects these into cart attach. */
export async function listBespokeSessionTokens(): Promise<string[]> {
  const { store, legacyToken } = parseSessionCookieStore(await readRaw());
  const tokens = store.entries.map((entry) => entry.token);
  if (legacyToken && tokens.length === 0) tokens.push(legacyToken);
  return tokens;
}
