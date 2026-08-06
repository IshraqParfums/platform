import type { AddressResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

export async function GET(): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  try {
    const { data } = await shopAuthFetch<AddressResponse[]>(
      "/customers/addresses",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { data } = await shopAuthFetch<AddressResponse>(
      "/customers/addresses",
      { method: "POST", body },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
