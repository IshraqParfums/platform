import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHub } from "@/components/account/account-hub";
import { BandInner } from "@/components/home-v2/ui/band";
import { ACCOUNT_HOME, loginPath } from "@/lib/auth/account-routes";
import { getShopAccessToken } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Ishraq Parfums orders, addresses and details.",
};

/**
 * Plain `<section>` + a form-width `BandInner`, matching checkout's page
 * shell (see the comment there) — one column of settled facts rather than a
 * two-up layout. `/account` is a paper route now (see `isPaperStorefrontPath`
 * in lib/layout.ts).
 *
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
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner width="form">
        <AccountHub />
      </BandInner>
    </section>
  );
}
