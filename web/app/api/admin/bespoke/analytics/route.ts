import type { BespokeAdminAnalytics } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days");
  const qs = days ? `?days=${encodeURIComponent(days)}` : "";

  try {
    const { data } = await adminAuthFetch<BespokeAdminAnalytics>(
      `/admin/bespoke/analytics${qs}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
