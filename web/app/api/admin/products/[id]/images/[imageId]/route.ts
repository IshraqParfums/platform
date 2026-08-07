import type { AdminProductImage, UpdateImageBody } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id, imageId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { data } = await adminAuthFetch<AdminProductImage>(
      `/admin/products/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      { method: "PATCH", body: body as UpdateImageBody },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id, imageId } = await context.params;

  try {
    await adminAuthFetch<void>(
      `/admin/products/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
      { method: "DELETE" },
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return jsonFromNestError(error);
  }
}
