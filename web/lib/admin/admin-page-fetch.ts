import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NestFetchInit } from "@/lib/api/nest";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { NestApiError } from "@/lib/api/errors";
import {
  ADMIN_HOME,
  ADMIN_PATHNAME_HEADER,
  adminLoginPath,
} from "@/lib/auth/admin-routes";
import { getAdminAccessToken } from "@/lib/auth/session";

export async function redirectToAdminLogin(): Promise<never> {
  const pathname =
    (await headers()).get(ADMIN_PATHNAME_HEADER) ?? ADMIN_HOME;
  redirect(adminLoginPath(pathname));
}

/**
 * Server-component data fetch for admin pages. The (dashboard) layout already
 * redirects when the access cookie is absent; this additionally catches a
 * present-but-expired token so a stale session lands back on the login page
 * instead of a thrown error. Refresh is client-side on the login page (refresh
 * cookie is path-scoped to `/api/admin/auth`).
 */
export async function adminPageFetch<T>(
  path: string,
  init?: Omit<NestFetchInit, "accessToken">,
): Promise<T> {
  if (!(await getAdminAccessToken())) {
    await redirectToAdminLogin();
  }

  try {
    const { data } = await adminAuthFetch<T>(path, init);
    return data;
  } catch (error) {
    if (error instanceof NestApiError && error.status === 401) {
      await redirectToAdminLogin();
    }
    throw error;
  }
}
