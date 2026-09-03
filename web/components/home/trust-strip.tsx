import type { ComponentType, SVGProps } from "react";
import { Container } from "@/components/ui/container";
import {
  DropletIcon,
  FlaskIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import { formatPaise } from "@/lib/format/money";

const ITEMS: Array<{
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  detail: string;
}> = [
  {
    icon: TruckIcon,
    label: `Flat ${formatPaise(SHIPPING_PAISE)} shipping`,
    detail: "Anywhere in India, no surprises at checkout",
  },
  {
    icon: FlaskIcon,
    label: "Small-batch handcrafted",
    detail: "Composed and bottled in limited runs",
  },
  {
    icon: DropletIcon,
    label: "Perfumer's palette",
    detail: "Real materials, not fragrance oils",
  },
  {
    icon: ShieldIcon,
    label: "Secure Razorpay checkout",
    detail: "UPI, cards, and net banking",
  },
];

export function TrustStrip() {
  return (
    <Section tone="cream-soft" space="compact" bordered className="py-0 md:py-0">
      <Container size="wide">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className={cn(
                  "py-7 lg:py-10",
                  // stacked on mobile, 2-up on sm, 4-up on lg — hairlines follow suit
                  i > 0 && "border-t border-line/50",
                  i > 1 && "sm:border-t",
                  i % 2 === 1 && "sm:border-l sm:border-line/50 sm:pl-8",
                  i < 2 && "sm:border-t-0",
                  i > 0 && "lg:border-l lg:border-t-0 lg:pl-8",
                )}
              >
                {/* Icon beside the text on narrow screens — stacking it above
                    wastes the width and makes the section needlessly tall. It
                    moves above the claim at `lg`, where four columns give a
                    cleaner rhythm. Staggered fade-up fires once on scroll-in,
                    matching the product grid. */}
                <Reveal
                  delay={i * 90}
                  className="flex items-start gap-4 lg:flex-col lg:gap-3"
                >
                  <Icon className="h-9 w-9 shrink-0 text-gold lg:h-10 lg:w-10" />

                  {/* The claim is the scannable line — display type rather than
                      mono caps, which is hard to read at a glance. The mono
                      uppercase voice stays on eyebrows and badges. */}
                  <div className="flex flex-col gap-1.5">
                    <p className="font-display text-[19px] font-semibold leading-snug text-ink">
                      {item.label}
                    </p>
                    <p className="text-meta text-ink-soft">{item.detail}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
