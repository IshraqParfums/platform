"use client";

import { useState } from "react";
import type { ProductFaqItem } from "@ishraqparfums/shared";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";

/**
 * FAQ accordion — reuses `ProductStory`'s expand/collapse mechanics (a
 * `useState` toggle), one shared "open index" rather than one flag per item
 * so opening a question closes the last one. Text affordance ("Read"/"Close")
 * instead of a plus/minus icon, per this site's no-icon rule.
 */
export function ProductFaq({ faq }: { faq: ProductFaqItem[] | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faq || faq.length === 0) return null;

  return (
    <Reveal>
      <div>
        <p className="text-[13px] text-terra">Questions</p>
        <div className="mt-4">
          {faq.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={index} className="border-t border-graphite/10 py-5">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-baseline justify-between gap-6 text-left"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  <span className="font-editorial text-h4-editorial text-graphite">
                    {item.question}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-ui text-[11px] uppercase tracking-[0.14em] text-terra",
                    )}
                  >
                    {open ? "Close" : "Read"}
                  </span>
                </button>
                {open ? (
                  <p className="mt-3 max-w-prose text-[15px] leading-[1.65] text-graphite-soft">
                    {item.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
