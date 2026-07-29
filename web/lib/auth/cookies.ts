import 'server-only';

import { cookies } from 'next/headers';

export type CookieSameSite = 'lax' | 'strict' | 'none';

export interface SetAuthCookieOptions {
  name: string;
  value: string;
  maxAge: number;
  path: string;
}

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

export async function getCookie(name: string): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(name)?.value;
}

export async function setAuthCookie(options: SetAuthCookieOptions): Promise<void> {
  const jar = await cookies();
  jar.set(options.name, options.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(),
    path: options.path,
    maxAge: options.maxAge,
  });
}

export async function deleteAuthCookie(
  name: string,
  path: string,
): Promise<void> {
  const jar = await cookies();
  jar.set(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(),
    path,
    maxAge: 0,
  });
}
