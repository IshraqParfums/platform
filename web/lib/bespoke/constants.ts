export const BESPOKE_SESSION_COOKIE = "ip_bespoke_session";
/** 7 days — matches Nest session expiry. */
export const BESPOKE_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
/**
 * Browser-side device limit for concurrent consultations. Nest itself supports
 * more sessions; once this many tokens sit in the cookie map, the oldest entry
 * is dropped and that tab can no longer auth.
 */
export const BESPOKE_SESSION_COOKIE_MAX_ENTRIES = 1;
/** Cookie store schema version. */
export const BESPOKE_SESSION_COOKIE_STORE_VERSION = 1 as const;
