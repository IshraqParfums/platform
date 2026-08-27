import { NextResponse } from "next/server";
import type {
  BespokeSessionCreateResponse,
  BespokeSessionViewResponse,
} from "@ishraqparfums/shared";
import { jsonFromNestError } from "@/lib/api/route-response";
import { bespokeNestFetch } from "@/lib/bespoke/bespoke-fetch";
import { putBespokeSessionToken } from "@/lib/bespoke/session-cookie";

/**
 * Creates a session and answers its opening node in one round trip, so a
 * homepage card that shows the engine's real first question can send the
 * visitor straight to the real second one instead of restarting the quiz.
 * `nodeId`/`version` come from the live create response rather than being
 * hardcoded, so this stays correct if the graph's start node ever changes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let optionId: unknown;
  try {
    ({ optionId } = await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (typeof optionId !== "string" || !optionId) {
    return NextResponse.json({ message: "optionId required." }, { status: 400 });
  }

  try {
    const { data: created } = await bespokeNestFetch<BespokeSessionCreateResponse>(
      "/bespoke/sessions",
      { method: "POST" },
    );
    await putBespokeSessionToken(created.sessionId, created.sessionToken);

    await bespokeNestFetch<BespokeSessionViewResponse>(
      `/bespoke/sessions/${created.sessionId}/answer`,
      {
        method: "POST",
        sessionId: created.sessionId,
        body: {
          nodeId: created.node.id,
          version: created.version,
          answer: { kind: "select", optionIds: [optionId] },
        },
      },
    );

    return NextResponse.json({ sessionId: created.sessionId });
  } catch (error) {
    return jsonFromNestError(error);
  }
}
