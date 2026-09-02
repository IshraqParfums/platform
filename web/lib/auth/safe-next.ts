/**
 * Allow only same-origin relative paths for post-login redirects.
 * Rejects protocol-relative URLs, absolute URLs, and empty values.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  if (decoded.includes("://")) return null;
  // Browsers normalize a backslash to a forward slash when resolving an
  // http(s) URL, so `/\evil.com` would otherwise slip past the `//` check
  // above and resolve to the protocol-relative `//evil.com`.
  if (decoded.includes("\\")) return null;
  return decoded;
}
