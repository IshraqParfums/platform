import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your Ishraq Parfums cart.",
};

export default function CartPage() {
  return (
    <Section space="default" className="!pt-10 md:!pt-14 !pb-16 md:!pb-24">
      <Container size="wide">
        <CartPageClient />
      </Container>
    </Section>
  );
}
