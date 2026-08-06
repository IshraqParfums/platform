import { NextResponse } from "next/server";
import { getShopAccessToken } from "@/lib/auth/session";

/**
 * Cookie-only shop session probe — no Nest round-trip.
 */
export async function GET(): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  return NextResponse.json({ authenticated: Boolean(accessToken) });
}
