import 'server-only';

import type {
  AdminAuthTokenResponse,
  AuthTokenResponse,
} from '@ishraqparfums/shared';
import { nestFetch } from '@/lib/api/nest';
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_ACCESS_EXPIRY_SKEW_SECONDS,
  ADMIN_ACCESS_MAX_AGE_SECONDS_DEFAULT,
  ADMIN_REFRESH_COOKIE,
  ADMIN_REFRESH_COOKIE_PATH,
  ADMIN_REFRESH_MAX_AGE_SECONDS,
  SHOP_ACCESS_COOKIE,
  SHOP_ACCESS_MAX_AGE_SECONDS,
  SHOP_REFRESH_COOKIE,
  SHOP_REFRESH_COOKIE_PATH,
  SHOP_REFRESH_MAX_AGE_SECONDS,
} from '@/lib/auth/constants';
import {
  deleteAuthCookie,
  getCookie,
  setAuthCookie,
} from '@/lib/auth/cookies';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Seconds until access token expiry (admin / optional). */
  expiresIn?: number;
}

export interface CustomerSessionSnapshot {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}

export interface AdminSessionSnapshot {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}

export async function createShopSession(tokens: TokenPair): Promise<void> {
  await setAuthCookie({
    name: SHOP_ACCESS_COOKIE,
    value: tokens.accessToken,
    maxAge: SHOP_ACCESS_MAX_AGE_SECONDS,
    path: '/',
  });
  await setAuthCookie({
    name: SHOP_REFRESH_COOKIE,
    value: tokens.refreshToken,
    maxAge: SHOP_REFRESH_MAX_AGE_SECONDS,
    path: SHOP_REFRESH_COOKIE_PATH,
  });
}

export async function clearShopSession(): Promise<void> {
  await deleteAuthCookie(SHOP_ACCESS_COOKIE, '/');
  await deleteAuthCookie(SHOP_REFRESH_COOKIE, SHOP_REFRESH_COOKIE_PATH);
}

export async function createAdminSession(tokens: TokenPair): Promise<void> {
  const accessLifetime =
    tokens.expiresIn && tokens.expiresIn > 0
      ? tokens.expiresIn
      : ADMIN_ACCESS_MAX_AGE_SECONDS_DEFAULT;
  const accessMaxAge = Math.max(
    1,
    accessLifetime - ADMIN_ACCESS_EXPIRY_SKEW_SECONDS,
  );

  await setAuthCookie({
    name: ADMIN_ACCESS_COOKIE,
    value: tokens.accessToken,
    maxAge: accessMaxAge,
    path: '/',
  });
  await setAuthCookie({
    name: ADMIN_REFRESH_COOKIE,
    value: tokens.refreshToken,
    maxAge: ADMIN_REFRESH_MAX_AGE_SECONDS,
    path: ADMIN_REFRESH_COOKIE_PATH,
  });
}

export async function clearAdminSession(): Promise<void> {
  await deleteAuthCookie(ADMIN_ACCESS_COOKIE, '/');
  await deleteAuthCookie(ADMIN_REFRESH_COOKIE, ADMIN_REFRESH_COOKIE_PATH);
}

export async function getCustomerSession(): Promise<CustomerSessionSnapshot> {
  const [access, refresh] = await Promise.all([
    getCookie(SHOP_ACCESS_COOKIE),
    getCookie(SHOP_REFRESH_COOKIE),
  ]);
  return {
    hasAccessToken: Boolean(access),
    hasRefreshToken: Boolean(refresh),
  };
}

export async function getAdminSession(): Promise<AdminSessionSnapshot> {
  const [access, refresh] = await Promise.all([
    getCookie(ADMIN_ACCESS_COOKIE),
    getCookie(ADMIN_REFRESH_COOKIE),
  ]);
  return {
    hasAccessToken: Boolean(access),
    hasRefreshToken: Boolean(refresh),
  };
}

export async function getShopAccessToken(): Promise<string | undefined> {
  return getCookie(SHOP_ACCESS_COOKIE);
}

export async function getShopRefreshToken(): Promise<string | undefined> {
  return getCookie(SHOP_REFRESH_COOKIE);
}

export async function getAdminAccessToken(): Promise<string | undefined> {
  return getCookie(ADMIN_ACCESS_COOKIE);
}

export async function getAdminRefreshToken(): Promise<string | undefined> {
  return getCookie(ADMIN_REFRESH_COOKIE);
}

/**
 * Rotates shop tokens via Nest. Throws NestApiError on failure; clears cookies on failure.
 */
export async function refreshShopSession(): Promise<TokenPair> {
  const refreshToken = await getShopRefreshToken();
  if (!refreshToken) {
    await clearShopSession();
    throw new Error('Missing shop refresh token');
  }

  try {
    const { data } = await nestFetch<AuthTokenResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    const pair: TokenPair = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    await createShopSession(pair);
    return pair;
  } catch (error) {
    await clearShopSession();
    throw error;
  }
}

/**
 * Rotates admin tokens via Nest. Clears cookies on failure.
 */
export async function refreshAdminSession(): Promise<TokenPair> {
  const refreshToken = await getAdminRefreshToken();
  if (!refreshToken) {
    await clearAdminSession();
    throw new Error('Missing admin refresh token');
  }

  try {
    const { data } = await nestFetch<AdminAuthTokenResponse>(
      '/admin/auth/refresh',
      {
        method: 'POST',
        body: { refreshToken },
      },
    );
    const pair: TokenPair = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
    await createAdminSession(pair);
    return pair;
  } catch (error) {
    await clearAdminSession();
    throw error;
  }
}
