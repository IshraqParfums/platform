import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Order",
  description: "Your Ishraq Parfums order.",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Section space="default" className="!pt-10 md:!pt-14 !pb-16 md:!pb-24">
      <Container size="narrow">
        <OrderConfirmation orderId={id} />
      </Container>
    </Section>
  );
}
