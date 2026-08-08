import type { BespokeSessionResultResponse } from "@ishraqparfums/shared";

async function readResult(res: Response): Promise<BespokeSessionResultResponse> {
  const body = (await res.json().catch(() => ({}))) as BespokeSessionResultResponse & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(
      typeof body.message === "string" ? body.message : "Result unavailable",
    );
  }
  return body;
}

/** POST /complete for a session — shared by quiz finish + result recovery. */
export async function completeBespokeSession(
  sessionId: string,
): Promise<BespokeSessionResultResponse> {
  const res = await fetch(`/api/bespoke/sessions/${sessionId}/complete`, {
    method: "POST",
  });
  return readResult(res);
}

/**
 * Load result; on 401/404/409 call complete (once), then retry result once if needed.
 */
export async function loadBespokeSessionResult(
  sessionId: string,
): Promise<BespokeSessionResultResponse> {
  const first = await fetch(`/api/bespoke/sessions/${sessionId}/result`);
  if (first.status === 401 || first.status === 404 || first.status === 409) {
    const completed = await completeBespokeSession(sessionId);
    // Complete already returns the result payload.
    if (completed.sessionId) return completed;
    const retry = await fetch(`/api/bespoke/sessions/${sessionId}/result`);
    return readResult(retry);
  }
  return readResult(first);
}
