import { permanentRedirect } from "next/navigation";
import { accountOrderPath } from "@/lib/auth/account-routes";

/**
 * Orders now live under Account. Checkout still redirects here after payment,
 * and customers may have kept the link — so this forwards to the real page
 * rather than leaving a second copy of it to drift out of step.
 */
export default async function LegacyOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(accountOrderPath(id));
}
