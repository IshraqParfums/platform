import 'server-only';

import { cookies } from 'next/headers';
import {
  BESPOKE_SESSION_COOKIE,
  BESPOKE_SESSION_MAX_AGE_SECONDS,
} from '@/lib/bespoke/constants';

export async function getBespokeSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(BESPOKE_SESSION_COOKIE)?.value;
}

export async function setBespokeSessionToken(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(BESPOKE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: BESPOKE_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearBespokeSessionToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(BESPOKE_SESSION_COOKIE);
}
