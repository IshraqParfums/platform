/** Admin IA paths, in one place so gates and redirects cannot drift apart. */
export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";

/** Set by middleware on authenticated `/admin/*` requests for RSC redirects. */
export const ADMIN_PATHNAME_HEADER = "x-admin-pathname";

/** Sign-in URL that returns the admin to where they were headed. */
export function adminLoginPath(next: string = ADMIN_HOME): string {
  return `${ADMIN_LOGIN}?next=${encodeURIComponent(next)}`;
}

/**
 * Post-login destination: allow only safe relative paths under `/admin`,
 * never back onto the login screen itself.
 */
export function safeAdminNext(raw: string | null | undefined): string {
  if (!raw) return ADMIN_HOME;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return ADMIN_HOME;
  }
  if (!decoded.startsWith("/admin")) return ADMIN_HOME;
  if (decoded.startsWith("//")) return ADMIN_HOME;
  if (decoded.includes("://")) return ADMIN_HOME;
  if (decoded === ADMIN_LOGIN || decoded.startsWith(`${ADMIN_LOGIN}?`)) {
    return ADMIN_HOME;
  }
  return decoded;
}
