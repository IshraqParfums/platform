import type { CheckoutRequest, CheckoutResponse } from "@ishraqparfums/shared";
import { apiErrorFrom } from "@/lib/api/api-error";
import { shopFetch } from "@/lib/auth/shop-fetch";

export async function startCheckout(
  body: CheckoutRequest,
): Promise<CheckoutResponse> {
  const response = await shopFetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await apiErrorFrom(response, "Could not start checkout");
  return (await response.json()) as CheckoutResponse;
}
