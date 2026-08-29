import Link from "next/link";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ButtonLink } from "@/components/ui/button";
import { loginPath } from "@/lib/auth/account-routes";

/**
 * Browsing is the job here, so it stays the only button. A guest also gets a
 * quiet line about signing in — the same promise the guest-cart modal makes,
 * offered rather than pressed, and never in place of the way to the shop.
 *
 * URDU: "ابھی خالی ہے" ("it's empty right now") is new and unreviewed, like
 * the other Urdu lines added across the bespoke pass — check with a native
 * reader before shipping.
 */
export function CartEmpty({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center sm:py-14 md:py-16">
      <Urdu size="sm" tone="brass" align="center">
        {"ابھی خالی ہے"}
      </Urdu>
      <h1 className="mt-4 font-editorial text-[clamp(32px,4.6vw,44px)] leading-[1.04] text-graphite">
        Nothing reserved yet.
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-graphite-soft">
        When a fragrance finds you, it will wait here, quietly, until you are
        ready.
      </p>

      <ButtonLink
        href="/shop"
        variant="ink"
        size="pill"
        className="mt-9 cursor-pointer"
      >
        Browse perfumes
      </ButtonLink>

      <p className="mt-6 text-sm text-graphite-faint">
        Or explore{" "}
        <Link
          href="/collections"
          className="underline decoration-graphite/25 underline-offset-[3px] transition-colors hover:text-terra hover:decoration-terra/50"
        >
          collections
        </Link>
        .
      </p>

      {!authenticated ? (
        <p className="mx-auto mt-8 max-w-sm border-t border-graphite/10 pt-6 text-sm leading-relaxed text-graphite-soft">
          <Link
            href={loginPath("/cart")}
            className="font-medium text-graphite underline decoration-graphite/25 underline-offset-[3px] transition-colors hover:text-terra hover:decoration-terra/50"
          >
            Sign in
          </Link>{" "}
          to keep your cart and orders with your account, on any device.
        </p>
      ) : null}
    </div>
  );
}
