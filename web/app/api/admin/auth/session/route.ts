import { NextResponse } from "next/server";
import { getAdminAccessToken } from "@/lib/auth/session";

/**
 * Cookie-only admin session probe — no Nest round-trip.
 */
export async function GET(): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  return NextResponse.json({ authenticated: Boolean(accessToken) });
}
