import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountOrders } from "@/components/account/account-orders";
import { BackLink } from "@/components/ui/back-link";
import { BandInner } from "@/components/home-v2/ui/band";
import {
  ACCOUNT_HOME,
  ACCOUNT_ORDERS,
  loginPath,
} from "@/lib/auth/account-routes";
import { getShopAccessToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Orders",
  description: "Your Ishraq Parfums order history.",
};

export default async function AccountOrdersPage() {
  if (!(await getShopAccessToken())) {
    redirect(loginPath(ACCOUNT_ORDERS));
  }

  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner width="form">
        <BackLink href={ACCOUNT_HOME} theme="v2">
          Back to account
        </BackLink>
        <div className="mt-7">
          <AccountOrders />
        </div>
      </BandInner>
    </section>
  );
}
