import { NextResponse } from 'next/server';
import { nestFetch } from '@/lib/api/nest';
import {
  clearAdminSession,
  getAdminAccessToken,
  getAdminRefreshToken,
} from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  const [accessToken, refreshToken] = await Promise.all([
    getAdminAccessToken(),
    getAdminRefreshToken(),
  ]);

  try {
    if (accessToken && refreshToken) {
      await nestFetch<void>('/admin/auth/logout', {
        method: 'POST',
        accessToken,
        body: { refreshToken },
      });
    }
  } catch {
    // Always clear local session even if Nest revoke fails.
  }

  await clearAdminSession();
  return new NextResponse(null, { status: 204 });
}
