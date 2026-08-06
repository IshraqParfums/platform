import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Checkout for Ishraq Parfums.",
};

/**
 * Placeholder until Razorpay checkout ships — keeps cart CTAs from 404ing.
 */
export default function CheckoutPage() {
  return (
    <Section space="compact" className="!pt-10 md:!pt-14 !pb-14">
      <Container size="narrow">
        <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink">
          Checkout
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          Checkout is next — your cart is saved. Secure payment will land here
          shortly.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/cart" variant="emphasis" size="md">
            Back to cart
          </ButtonLink>
          <ButtonLink href="/shop" variant="outline" size="md">
            Continue shopping
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-ink-faint">
          Need help?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          so your cart stays with your account.
        </p>
      </Container>
    </Section>
  );
}
