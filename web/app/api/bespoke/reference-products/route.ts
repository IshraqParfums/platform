import { NextResponse } from 'next/server';
import type { BespokeReferenceProduct } from '@ishraqparfums/shared';
import { nestFetch } from '@/lib/api/nest';
import { jsonFromNestError } from '@/lib/api/route-response';

export async function GET(): Promise<NextResponse> {
  try {
    const { data } = await nestFetch<BespokeReferenceProduct[]>(
      '/bespoke/reference-products',
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
