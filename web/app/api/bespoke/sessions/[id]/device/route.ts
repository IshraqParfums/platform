import { NextResponse } from "next/server";
import { removeBespokeSessionToken } from "@/lib/bespoke/session-cookie";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Drop this device's cookie token for a session. Does not delete the Nest row —
 * nightly prune handles abandoned sessions.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  await removeBespokeSessionToken(id);
  return new NextResponse(null, { status: 204 });
}
