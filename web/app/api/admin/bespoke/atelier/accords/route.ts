import type { AtelierAccordSummary } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";

  try {
    const { data } = await adminAuthFetch<AtelierAccordSummary[]>(
      `/admin/bespoke/atelier/accords${qs}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
