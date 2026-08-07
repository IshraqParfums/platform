/**
 * Nest / class-validator often returns `message` as a string or string[].
 * Normalize for toasts and thrown Errors.
 */
export function readAdminErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (typeof body !== "object" || body === null || !("message" in body)) {
    return fallback;
  }

  const message = (body as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  if (Array.isArray(message)) {
    const parts = message
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }

  return fallback;
}

export async function readAdminResponseError(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => null);
  return readAdminErrorMessage(body, fallback);
}
