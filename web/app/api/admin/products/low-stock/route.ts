import type { AdminLowStockVariant } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  const threshold = searchParams.get("threshold");
  if (threshold) query.set("threshold", threshold);
  const qs = query.toString();

  try {
    const { data } = await adminAuthFetch<AdminLowStockVariant[]>(
      qs ? `/admin/products/low-stock?${qs}` : "/admin/products/low-stock",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
