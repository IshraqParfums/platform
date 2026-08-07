import { refreshAdminSessionClient } from "@/lib/auth/admin-fetch";

/**
 * Cheap cookie probe — is the admin ACCESS cookie present?
 *
 * Deliberately not exported: on its own it is not a useful answer. The access
 * cookie can lapse while the refresh cookie is still valid. Callers want
 * `ensureAdminSession`.
 */
async function hasAdminAccessCookie(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/auth/session", { cache: "no-store" });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: unknown };
    return data.authenticated === true;
  } catch {
    return false;
  }
}

/**
 * Is the admin signed in, allowing for a lapsed access cookie?
 *
 * The refresh cookie is path-scoped to `/api/admin/auth`, so no page — server
 * or client — can see it directly. This rotates the session once before giving
 * up, the same recovery `adminFetch` performs on a 401, hoisted to where a
 * screen has to decide who it is talking to.
 *
 * Cheap for true guests: with no refresh cookie the BFF answers 401 from the
 * cookie alone, without calling Nest.
 */
export async function ensureAdminSession(): Promise<boolean> {
  if (await hasAdminAccessCookie()) return true;
  return refreshAdminSessionClient();
}
