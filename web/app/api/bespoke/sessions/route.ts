import { NextResponse } from "next/server";
import type {
  BespokeSessionCreateResponse,
  BespokeSessionViewResponse,
} from "@ishraqparfums/shared";
import { NestApiError } from "@/lib/api/errors";
import { jsonFromNestError } from "@/lib/api/route-response";
import { bespokeNestFetch } from "@/lib/bespoke/bespoke-fetch";
import {
  listBespokeSessionIds,
  putBespokeSessionToken,
  removeBespokeSessionToken,
} from "@/lib/bespoke/session-cookie";

/**
 * List consultations known to this device (cookie map). Probes Nest and
 * evicts dead cookie entries so the landing never shows ghosts.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const ids = await listBespokeSessionIds();
    const settled = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await bespokeNestFetch<BespokeSessionViewResponse>(
            `/bespoke/sessions/${encodeURIComponent(id)}`,
            { sessionId: id },
          );
          if (data.status === "EXPIRED") {
            await removeBespokeSessionToken(id);
            return null;
          }
          return { id, view: data };
        } catch (error) {
          if (
            error instanceof NestApiError &&
            (error.status === 404 || error.status === 410)
          ) {
            await removeBespokeSessionToken(id);
            return null;
          }
          // Auth / transient failures: keep the cookie, omit from list.
          return null;
        }
      }),
    );

    const sessions = settled
      .filter(
        (row): row is { id: string; view: BespokeSessionViewResponse } =>
          row != null,
      )
      .map((row) => row.view);

    return NextResponse.json({ sessions });
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const { data } = await bespokeNestFetch<BespokeSessionCreateResponse>(
      "/bespoke/sessions",
      { method: "POST" },
    );
    await putBespokeSessionToken(data.sessionId, data.sessionToken);
    const { sessionToken: _omit, ...safe } = data;
    return NextResponse.json(safe);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
