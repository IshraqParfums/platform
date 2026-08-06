import type {
  OrderDetail,
  OrderSummary,
  PaginatedResponse,
  RazorpayVerifyRequest,
} from "@ishraqparfums/shared";
import { shopFetch } from "@/lib/auth/shop-fetch";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (typeof body.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return "Something went wrong";
}

export async function getOrder(id: string): Promise<OrderDetail> {
  const response = await shopFetch(
    `/api/orders/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error("not found");
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as OrderDetail;
}

export async function listOrders(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<OrderSummary>> {
  const query = new URLSearchParams();
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.pageSize != null) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  const response = await shopFetch(qs ? `/api/orders?${qs}` : "/api/orders", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as PaginatedResponse<OrderSummary>;
}

export async function verifyRazorpayPayment(
  body: RazorpayVerifyRequest,
): Promise<OrderDetail> {
  const response = await shopFetch("/api/payments/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as OrderDetail;
}

/** Poll until order leaves PENDING_PAYMENT or attempts exhausted. */
export async function pollOrderUntilSettled(
  orderId: string,
  options?: { attempts?: number; intervalMs?: number },
): Promise<OrderDetail | null> {
  const attempts = options?.attempts ?? 6;
  const intervalMs = options?.intervalMs ?? 1500;

  for (let i = 0; i < attempts; i += 1) {
    try {
      const order = await getOrder(orderId);
      if (order.status !== "PENDING_PAYMENT") return order;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}
