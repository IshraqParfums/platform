"use client";

import { useState } from "react";
import type { ProductFaqItem } from "@ishraqparfums/shared";
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faq || faq.length === 0) return null;

  return (
    <RecordSection kicker="Questions, answered">
      {faq.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={index} className="border-t border-graphite/10">
            <button
              type="button"
              className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-5 text-left"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span className="min-w-0 flex-1 font-editorial text-[20px] leading-[1.3] text-graphite">
                {item.question}
              </span>
              <span className="shrink-0 text-[13px] text-terra">
                {open ? "Close" : "Read"}
              </span>
            </button>
            {open ? (
              <p className="pb-6 text-[16px] leading-[1.7] text-graphite">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </RecordSection>
  );
}
