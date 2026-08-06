import type { CheckoutRequest, CheckoutResponse } from "@ishraqparfums/shared";
import { shopFetch } from "@/lib/auth/shop-fetch";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return "Could not start checkout";
}

export async function startCheckout(
  body: CheckoutRequest,
): Promise<CheckoutResponse> {
  const response = await shopFetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as CheckoutResponse;
}
