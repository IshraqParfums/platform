import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { orderId } = await context.params;

  try {
    const { data } = await shopAuthFetch<{ ok: true }>(
      `/checkout/${encodeURIComponent(orderId)}/abandon`,
      { method: "POST" },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
