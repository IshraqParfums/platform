"use client";

import type { ProductFaqItem } from "@ishraqparfums/shared";
import {
  RecordDisclosure,
  useExclusiveDisclosure,
} from "@/components/product-v2/ui/record-disclosure";
import { RecordSection } from "@/components/product-v2/ui/record";

/**
 * Questions, answered.
 *
 * One open index rather than a flag per row, so opening a question closes
 * the previous one — with three or four entries, a fully-expandable list
 * just becomes a wall again. All closed until the reader opens one.
 *
 * The affordance is a word, not a rotating glyph: type is this site's whole
 * visual language and an icon here would be the only one on the page.
 */
export function ProductFaq({ faq }: { faq: ProductFaqItem[] | null }) {
  const { isOpen, toggle } = useExclusiveDisclosure<number>();

  if (!faq || faq.length === 0) return null;

  return (
    <RecordSection kicker="Questions, answered">
      {faq.map((item, index) => (
        <RecordDisclosure
          key={index}
          open={isOpen(index)}
          onToggle={() => toggle(index)}
          title={item.question}
          closedAffordance="Read"
          openAffordance="Close"
        >
          <p className="text-[16px] leading-[1.7] text-graphite">
            {item.answer}
          </p>
        </RecordDisclosure>
      ))}
    </RecordSection>
  );
}
