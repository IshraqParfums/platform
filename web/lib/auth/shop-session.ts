import { refreshShopSessionClient } from "@/lib/auth/shop-fetch";

/**
 * Cheap cookie probe — is the shop ACCESS cookie present?
 *
 * Deliberately not exported: on its own it is not a useful answer. The access
 * cookie lives 15 minutes, so a probe alone reports a returning customer as a
 * guest. Every caller wants `ensureShopSession`.
 */
async function hasShopAccessCookie(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: unknown };
    return data.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * Is the shopper signed in, allowing for a lapsed access cookie?
 *
 * The refresh cookie lives 30 days but is path-scoped to `/api/auth`, so no
 * page — server or client — can see it directly. This rotates the session once
 * before giving up, the same recovery `shopFetch` performs on a 401, hoisted to
 * where a screen has to decide who it is talking to.
 *
 * Cheap for real guests: with no refresh cookie the BFF answers 401 from the
 * cookie alone, without calling Nest.
 */
export async function ensureShopSession(): Promise<boolean> {
  if (await hasShopAccessCookie()) return true;
  return refreshShopSessionClient();
}
