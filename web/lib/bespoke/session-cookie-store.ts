import {
  BESPOKE_SESSION_COOKIE_MAX_ENTRIES,
  BESPOKE_SESSION_COOKIE_STORE_VERSION,
} from "@/lib/bespoke/constants";

export interface BespokeSessionCookieEntry {
  id: string;
  token: string;
  at: number;
}

export interface BespokeSessionCookieStore {
  v: typeof BESPOKE_SESSION_COOKIE_STORE_VERSION;
  entries: BespokeSessionCookieEntry[];
}

function emptyStore(): BespokeSessionCookieStore {
  return { v: BESPOKE_SESSION_COOKIE_STORE_VERSION, entries: [] };
}

/**
 * Parse cookie payload. Accepts v1 JSON map or legacy bare token string
 * (legacy has no session id — callers may use it as a one-shot fallback).
 */
export function parseSessionCookieStore(raw: string | undefined): {
  store: BespokeSessionCookieStore;
  legacyToken?: string;
} {
  if (!raw) return { store: emptyStore() };

  const trimmed = raw.trim();
  if (!trimmed) return { store: emptyStore() };

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<BespokeSessionCookieStore>;
      if (
        parsed?.v === BESPOKE_SESSION_COOKIE_STORE_VERSION &&
        Array.isArray(parsed.entries)
      ) {
        const entries = parsed.entries.filter(
          (e): e is BespokeSessionCookieEntry =>
            !!e &&
            typeof e.id === "string" &&
            typeof e.token === "string" &&
            typeof e.at === "number",
        );
        return {
          store: { v: BESPOKE_SESSION_COOKIE_STORE_VERSION, entries },
        };
      }
    } catch {
      // fall through to empty
    }
    return { store: emptyStore() };
  }

  // Legacy single-token cookie (pre-map).
  return { store: emptyStore(), legacyToken: trimmed };
}

export function serializeSessionCookieStore(
  store: BespokeSessionCookieStore,
): string {
  return JSON.stringify(store);
}

function prune(
  entries: BespokeSessionCookieEntry[],
  max = BESPOKE_SESSION_COOKIE_MAX_ENTRIES,
): BespokeSessionCookieEntry[] {
  if (entries.length <= max) return entries;
  return [...entries].sort((a, b) => a.at - b.at).slice(entries.length - max);
}

export function upsertSessionToken(
  store: BespokeSessionCookieStore,
  sessionId: string,
  token: string,
  at = Date.now(),
): BespokeSessionCookieStore {
  const without = store.entries.filter((e) => e.id !== sessionId);
  without.push({ id: sessionId, token, at });
  return {
    v: BESPOKE_SESSION_COOKIE_STORE_VERSION,
    entries: prune(without),
  };
}

export function removeSessionToken(
  store: BespokeSessionCookieStore,
  sessionId: string,
): BespokeSessionCookieStore {
  return {
    v: BESPOKE_SESSION_COOKIE_STORE_VERSION,
    entries: store.entries.filter((e) => e.id !== sessionId),
  };
}

export function getSessionTokenFromStore(
  store: BespokeSessionCookieStore,
  sessionId: string,
  legacyToken?: string,
): string | undefined {
  const hit = store.entries.find((e) => e.id === sessionId);
  if (hit) return hit.token;
  // Legacy cookie has no id binding — only usable when the map is empty.
  if (legacyToken && store.entries.length === 0) return legacyToken;
  return undefined;
}

/** Session ids newest-first (by `at`). */
export function listSessionIds(store: BespokeSessionCookieStore): string[] {
  return [...store.entries]
    .sort((a, b) => b.at - a.at)
    .map((e) => e.id);
}
