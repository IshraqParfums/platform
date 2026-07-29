import { NextResponse } from 'next/server';
import { NestApiError } from '@/lib/api/errors';
import { jsonFromNestError, unauthorizedResponse } from '@/lib/api/route-response';
import {
  clearShopSession,
  getShopRefreshToken,
  refreshShopSession,
} from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getShopRefreshToken();
  if (!refreshToken) {
    await clearShopSession();
    return unauthorizedResponse();
  }

  try {
    await refreshShopSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await clearShopSession();
    if (error instanceof NestApiError) {
      return jsonFromNestError(error);
    }
    return unauthorizedResponse();
  }
}
