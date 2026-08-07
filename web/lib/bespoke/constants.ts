import 'server-only';

export const BESPOKE_SESSION_COOKIE = 'ip_bespoke_session';
/** 7 days — matches Nest session expiry. */
export const BESPOKE_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
