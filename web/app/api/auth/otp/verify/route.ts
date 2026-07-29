import type { AuthTokenResponse } from '@ishraqparfums/shared';
import { NextResponse } from 'next/server';
import { nestFetch } from '@/lib/api/nest';
import { jsonFromNestError } from '@/lib/api/route-response';
import { createShopSession } from '@/lib/auth/session';

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as { phone?: unknown }).phone !== 'string' ||
    typeof (body as { code?: unknown }).code !== 'string'
  ) {
    return NextResponse.json(
      { message: 'phone and code are required' },
      { status: 400 },
    );
  }

  try {
    const { data } = await nestFetch<AuthTokenResponse>('/auth/otp/verify', {
      method: 'POST',
      body: {
        phone: (body as { phone: string }).phone,
        code: (body as { code: string }).code,
      },
    });

    await createShopSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return NextResponse.json({ customer: data.customer });
  } catch (error) {
    return jsonFromNestError(error);
  }
}
