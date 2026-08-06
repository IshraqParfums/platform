import type { ProductReviewsResponse, ReviewResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { nestFetch } from "@/lib/api/nest";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  const qs = new URLSearchParams();
  if (page) qs.set("page", page);
  if (pageSize) qs.set("pageSize", pageSize);
  const query = qs.toString();

  try {
    const { data } = await nestFetch<ProductReviewsResponse>(
      `/products/${encodeURIComponent(slug)}/reviews${query ? `?${query}` : ""}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { slug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { rating?: unknown }).rating !== "number"
  ) {
    return NextResponse.json({ message: "rating is required" }, { status: 400 });
  }

  const rating = (body as { rating: number }).rating;
  const title =
    typeof (body as { title?: unknown }).title === "string"
      ? (body as { title: string }).title.trim()
      : undefined;
  const reviewBody =
    typeof (body as { body?: unknown }).body === "string"
      ? (body as { body: string }).body.trim()
      : undefined;

  const payload: { rating: number; title?: string; body?: string } = { rating };
  if (title) payload.title = title;
  if (reviewBody) payload.body = reviewBody;

  try {
    const { data } = await shopAuthFetch<ReviewResponse>(
      `/products/${encodeURIComponent(slug)}/reviews`,
      { method: "POST", body: payload },
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return jsonFromNestError(error);
  }
}
