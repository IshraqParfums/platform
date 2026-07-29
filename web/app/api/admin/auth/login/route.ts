import type { AdminAuthTokenResponse } from '@ishraqparfums/shared';
import { NextResponse } from 'next/server';
import { nestFetch } from '@/lib/api/nest';
import { jsonFromNestError } from '@/lib/api/route-response';
import { createAdminSession } from '@/lib/auth/session';

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
    typeof (body as { email?: unknown }).email !== 'string' ||
    typeof (body as { password?: unknown }).password !== 'string'
  ) {
    return NextResponse.json(
      { message: 'email and password are required' },
      { status: 400 },
    );
  }

  try {
    const { data } = await nestFetch<AdminAuthTokenResponse>(
      '/admin/auth/login',
      {
        method: 'POST',
        body: {
          email: (body as { email: string }).email,
          password: (body as { password: string }).password,
        },
      },
    );

    await createAdminSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });

    return NextResponse.json({
      admin: data.admin,
      expiresIn: data.expiresIn,
    });
  } catch (error) {
    return jsonFromNestError(error);
  }
}
