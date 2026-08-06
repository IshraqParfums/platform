import type { CartResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

export async function GET(): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  try {
    const { data } = await shopAuthFetch<CartResponse>("/cart");
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
