import type { AdminCustomerSummary, PaginatedResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  for (const key of ["search", "sort", "page", "pageSize"]) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();

  try {
    const { data } = await adminAuthFetch<PaginatedResponse<AdminCustomerSummary>>(
      qs ? `/admin/customers?${qs}` : "/admin/customers",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
