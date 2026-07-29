import 'server-only';

export const SHOP_ACCESS_COOKIE = 'ishraq_shop_at';
export const SHOP_REFRESH_COOKIE = 'ishraq_shop_rt';
export const ADMIN_ACCESS_COOKIE = 'ishraq_admin_at';
export const ADMIN_REFRESH_COOKIE = 'ishraq_admin_rt';

/** Match Nest ACCESS_TOKEN_EXPIRES_IN = 15m */
export const SHOP_ACCESS_MAX_AGE_SECONDS = 15 * 60;

/** Match Nest REFRESH_TOKEN_TTL_DAYS = 30 */
export const SHOP_REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Fallback when Supabase session does not return expiresIn */
export const ADMIN_ACCESS_MAX_AGE_SECONDS_DEFAULT = 60 * 60;

/**
 * Expire the admin access cookie slightly before the token itself, so a present
 * cookie always implies a still-live token rather than one that just lapsed.
 */
export const ADMIN_ACCESS_EXPIRY_SKEW_SECONDS = 30;

export const ADMIN_REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const SHOP_REFRESH_COOKIE_PATH = '/api/auth';
export const ADMIN_REFRESH_COOKIE_PATH = '/api/admin/auth';
