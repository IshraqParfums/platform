import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHub } from "@/components/account/account-hub";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ACCOUNT_HOME, loginPath } from "@/lib/auth/account-routes";
import { getShopAccessToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Ishraq Parfums orders, addresses and details.",
};

/**
 * Guests are turned away here rather than on the client, so a signed-out
 * visitor never sees the lobby flash before the door. A lapsed-but-refreshable
 * session passes this check only after `AccountHub` rotates it — which is why
 * the client keeps its own gate.
 */
export default async function AccountPage() {
  if (!(await getShopAccessToken())) {
    redirect(loginPath(ACCOUNT_HOME));
  }

  return (
    <Section space="default" className="!pt-10 md:!pt-14 !pb-16 md:!pb-24">
      <Container size="form">
        <AccountHub />
      </Container>
    </Section>
  );
}
