import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountOrders } from "@/components/account/account-orders";
import { BackLink } from "@/components/ui/back-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
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
    <Section space="default" className="!pt-10 md:!pt-14 !pb-16 md:!pb-24">
      <Container size="form">
        <BackLink href={ACCOUNT_HOME}>Back to account</BackLink>
        <div className="mt-7">
          <AccountOrders />
        </div>
      </Container>
    </Section>
  );
}
