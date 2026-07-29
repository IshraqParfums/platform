import { NextResponse } from 'next/server';
import { NestApiError } from '@/lib/api/errors';
import { jsonFromNestError, unauthorizedResponse } from '@/lib/api/route-response';
import {
  clearAdminSession,
  getAdminRefreshToken,
  refreshAdminSession,
} from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getAdminRefreshToken();
  if (!refreshToken) {
    await clearAdminSession();
    return unauthorizedResponse();
  }

  try {
    await refreshAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await clearAdminSession();
    if (error instanceof NestApiError) {
      return jsonFromNestError(error);
    }
    return unauthorizedResponse();
  }
}
