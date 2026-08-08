import { NextResponse } from "next/server";
import type { BespokeSessionViewResponse } from "@ishraqparfums/shared";
import { jsonFromNestError } from "@/lib/api/route-response";
import { bespokeNestFetch } from "@/lib/bespoke/bespoke-fetch";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { data } = await bespokeNestFetch<BespokeSessionViewResponse>(
      `/bespoke/sessions/${encodeURIComponent(id)}/answer`,
      { method: "POST", body, sessionId: id },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
