import type { RequestOtpResponse } from '@ishraqparfums/shared';
import { NextResponse } from 'next/server';
import { nestFetch } from '@/lib/api/nest';
import { jsonFromNestError } from '@/lib/api/route-response';

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
    typeof (body as { phone?: unknown }).phone !== 'string'
  ) {
    return NextResponse.json(
      { message: 'phone is required' },
      { status: 400 },
    );
  }

  try {
    const { data } = await nestFetch<RequestOtpResponse>('/auth/otp/request', {
      method: 'POST',
      body: { phone: (body as { phone: string }).phone },
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
