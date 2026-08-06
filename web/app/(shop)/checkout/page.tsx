import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/checkout-page";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for Ishraq Parfums.",
};

export default function CheckoutPage() {
  return (
    <Section space="default" className="!pt-10 md:!pt-14 !pb-16 md:!pb-24">
      <Container size="form">
        <CheckoutPageClient />
      </Container>
    </Section>
  );
}
