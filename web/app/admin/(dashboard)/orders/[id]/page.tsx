import type { AdminOrderDetail } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import {
  BespokeOrderBadge,
  OrderBespokeCompositionLink,
} from "@/components/admin/order-bespoke-composition-button";
import { OrderCustomerStrip } from "@/components/admin/order-customer-strip";
import { OrderStatusToolbar } from "@/components/admin/order-status-toolbar";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { NestApiError } from "@/lib/api/errors";
import { formatPaise } from "@/lib/format/money";
import { formatOrderDateTime, orderReference } from "@/lib/orders/order-status";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Order detail" };

type RouteParams = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: RouteParams) {
  const { id } = await params;

  let order: AdminOrderDetail;
  try {
    order = await adminPageFetch<AdminOrderDetail>(`/admin/orders/${id}`);
  } catch (error) {
    if (error instanceof NestApiError && (error.status === 404 || error.status === 400)) {
      notFound();
    }
    throw error;
  }

  const paymentPaid =
    order.payment?.status === "PAID" ||
    (order.status !== "PENDING_PAYMENT" &&
      order.status !== "FAILED" &&
      order.status !== "EXPIRED");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <AdminBackLink href="/admin/orders?statusGroup=active">
          Back to orders
        </AdminBackLink>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {orderReference(order.id)}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Placed {formatOrderDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusToolbar orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <OrderCustomerStrip
            customerId={order.customerId}
            name={order.customerName}
            email={order.customerEmail}
            phone={order.customerPhone}
          />

          <div className="rounded-lg border border-ink/10 bg-card p-4">
            <h2 className="font-display text-lg font-semibold text-ink">Items</h2>
            <div className="mt-3 flex flex-col gap-2">
              {order.items.map((item) => {
                const isBespoke = Boolean(item.bespokePerfumeId);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-lg px-3 py-3",
                      isBespoke
                        ? "border border-gold/35 bg-gold/[0.07]"
                        : "border border-transparent",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-ink">
                          {item.productName}
                        </p>
                        {isBespoke ? <BespokeOrderBadge /> : null}
                      </div>
                      <p className="mt-1 text-sm text-ink-faint">
                        {item.sizeMl} ml · Qty {item.quantity}
                      </p>
                      {item.bespokePerfumeId ? (
                        <div className="mt-2">
                          <OrderBespokeCompositionLink
                            bespokePerfumeId={item.bespokePerfumeId}
                          />
                        </div>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-medium text-ink">
                      {formatPaise(item.lineTotalPaise)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col gap-1 border-t border-ink/[0.08] pt-3 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{formatPaise(order.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Shipping</span>
                <span>{formatPaise(order.shippingPaise)}</span>
              </div>
              <div className="flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span>{formatPaise(order.totalPaise)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-ink/10 bg-card p-4">
            <h2 className="font-display text-lg font-semibold text-ink">Payment</h2>
            {order.payment ? (
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-ink">
                    {paymentPaid ? "Paid" : order.payment.status}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatPaise(order.payment.amountPaise)}
                  </span>
                </div>
                <details className="group mt-1">
                  <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
                    Razorpay details
                  </summary>
                  <dl className="mt-2 flex flex-col gap-2 text-sm">
                    <div>
                      <dt className="text-ink-faint">Order id</dt>
                      <dd className="break-all text-ink">
                        {order.payment.razorpayOrderId}
                      </dd>
                    </div>
                    {order.payment.razorpayPaymentId ? (
                      <div>
                        <dt className="text-ink-faint">Payment id</dt>
                        <dd className="break-all text-ink">
                          {order.payment.razorpayPaymentId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </details>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-faint">No payment recorded.</p>
            )}
          </div>

          <div className="rounded-lg border border-ink/10 bg-card p-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Shipping address
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? (
                <>, {order.shippingAddress.line2}</>
              ) : null}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
