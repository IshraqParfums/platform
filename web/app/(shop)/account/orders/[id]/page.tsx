import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderDetail } from "@/components/account/order-detail";
import { BackLink } from "@/components/ui/back-link";
import { BandInner } from "@/components/home-v2/ui/band";
import {
  ACCOUNT_ORDERS,
  accountOrderPath,
  loginPath,
} from "@/lib/auth/account-routes";
import { getShopAccessToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Order",
  description: "Your Ishraq Parfums order.",
};

/**
 * The canonical order page — reached both from history and from the redirect
 * that follows payment, so the order keeps one address and one voice.
 *
 * `?placed=1` is set by checkout and only by checkout: it is what lets this
 * page greet a brand-new order warmly without greeting a six-month-old one the
 * same way.
 */
export default async function AccountOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);

  if (!(await getShopAccessToken())) {
    redirect(loginPath(accountOrderPath(id)));
  }

  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner width="form">
        <BackLink href={ACCOUNT_ORDERS} theme="v2">
          Back to orders
        </BackLink>
        <div className="mt-7">
          {/* Keyed so navigating between orders remounts rather than showing
              the previous order for a frame. */}
          <OrderDetail key={id} orderId={id} justPlaced={placed === "1"} />
        </div>
      </BandInner>
    </section>
  );
}
