import type { AdminOrderSummary, PaginatedResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  for (const key of ["status", "statusGroup", "customerId", "page", "pageSize"]) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();

  try {
    const { data } = await adminAuthFetch<PaginatedResponse<AdminOrderSummary>>(
      qs ? `/admin/orders?${qs}` : "/admin/orders",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
