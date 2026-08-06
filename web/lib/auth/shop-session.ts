/**
 * Client helper: is the shopper signed in (shop access cookie present)?
 */
export async function isShopAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: unknown };
    return data.authenticated === true;
  } catch {
    return false;
  }
}
