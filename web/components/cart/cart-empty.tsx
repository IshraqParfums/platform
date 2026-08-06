import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { loginPath } from "@/lib/auth/account-routes";

/**
 * Browsing is the job here, so it stays the only button. A guest also gets a
 * quiet line about signing in — the same promise the guest-cart modal makes,
 * offered rather than pressed, and never in place of the way to the shop.
 */
export function CartEmpty({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center sm:py-14 md:py-16">
      <p className="font-mono text-label-sm uppercase tracking-[0.16em] text-ink-faint">
        Cart
      </p>
      <h1 className="font-display mt-4 text-[clamp(2rem,4.5vw,2.75rem)] font-semibold tracking-[-0.025em] text-ink">
        Nothing reserved yet
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
        When a fragrance finds you, it will wait here — quietly, until you are
        ready.
      </p>

      <ButtonLink
        href="/shop"
        variant="emphasis"
        size="md"
        className="mt-9 cursor-pointer"
      >
        Browse perfumes
      </ButtonLink>

      <p className="mt-6 text-sm text-ink-faint">
        Or explore{" "}
        <Link
          href="/collections"
          className="underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink/50"
        >
          collections
        </Link>
        .
      </p>

      {!authenticated ? (
        <p className="mx-auto mt-8 max-w-sm border-t border-ink/[0.08] pt-6 text-sm leading-relaxed text-ink-soft">
          <Link
            href={loginPath("/cart")}
            className="font-medium text-ink underline decoration-ink/25 underline-offset-[3px] transition-colors hover:decoration-ink/50"
          >
            Sign in
          </Link>{" "}
          to keep your cart and orders with your account, on any device.
        </p>
      ) : null}
    </div>
  );
}
