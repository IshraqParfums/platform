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

/**
 * Release hard stock holds after Razorpay dismiss / failure.
 * Best-effort: TTL sweeper remains the safety net if this call fails.
 */
export async function abandonCheckout(orderId: string): Promise<void> {
  try {
    await shopFetch(`/api/checkout/${encodeURIComponent(orderId)}/abandon`, {
      method: "POST",
    });
  } catch {
    // Network blips are fine — expiry cron still releases.
  }
}
