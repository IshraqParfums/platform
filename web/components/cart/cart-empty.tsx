import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export function CartEmpty() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center sm:py-14 md:py-16">
      <p className="font-mono text-label-sm uppercase tracking-[0.16em] text-ink-faint">
        Cart
      </p>
      <h1 className="font-display mt-4 text-[clamp(2rem,4.5vw,2.75rem)] font-semibold tracking-[-0.025em] text-ink">
        Nothing reserved yet
      </h1>
      <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft sm:text-base">
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
    </div>
  );
}
