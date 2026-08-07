import type { AdminProductImage } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { NestApiError, readNestErrorBody } from "@/lib/api/errors";
import { getNestApiBaseUrl } from "@/lib/config";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Multipart forward — bypasses nestFetch's JSON body handling so the browser's
 * `file` upload streams straight through to Nest with its original boundary.
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;
  const formData = await request.formData();

  const base = getNestApiBaseUrl();
  const url = `${base}/api/v1/admin/products/${encodeURIComponent(id)}/images`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await readNestErrorBody(response);
      throw new NestApiError(response.status, body);
    }

    const data = (await response.json()) as AdminProductImage;
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
