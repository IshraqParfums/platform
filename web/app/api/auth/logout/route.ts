import { NextResponse } from 'next/server';
import { nestFetch } from '@/lib/api/nest';
import {
  clearShopSession,
  getShopRefreshToken,
} from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getShopRefreshToken();

  try {
    if (refreshToken) {
      await nestFetch<void>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    }
  } catch {
    // Always clear local session even if Nest revoke fails.
  }

  await clearShopSession();
  return new NextResponse(null, { status: 204 });
}
