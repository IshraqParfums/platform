import { NextResponse } from "next/server";
import type { BespokeSessionResultResponse } from "@ishraqparfums/shared";
import {
  jsonFromNestError,
  unauthorizedResponse,
} from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";
import { bespokeNestFetch } from "@/lib/bespoke/bespoke-fetch";
import { removeBespokeSessionToken } from "@/lib/bespoke/session-cookie";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;
  try {
    const { data } = await bespokeNestFetch<BespokeSessionResultResponse>(
      `/bespoke/sessions/${encodeURIComponent(id)}/claim`,
      { method: "POST", sessionId: id },
    );
    await removeBespokeSessionToken(id);
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
