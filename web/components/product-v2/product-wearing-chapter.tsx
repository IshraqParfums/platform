import { PDP_CARE, PDP_WEAR } from "@/lib/content/pdp-wear";
import { pdpSplitPairClass } from "@/components/product-v2/chapters";
import { RecordSection } from "@/components/product-v2/ui/record";

/**
 * How to put it on, and how to look after it — the same copy on every PDP.
 * Side by side from md up; stacked on a phone.
 */
export function ProductWearingChapter() {
  return (
    <div className={pdpSplitPairClass}>
      <RecordSection kicker="Wearing it">
        <ol>
          {PDP_WEAR.map((step, i) => (
            <li
              key={i}
              className="flex items-baseline gap-4 border-t border-graphite/10 py-4"
            >
              <span className="text-[13px] font-semibold text-terra">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[16px] leading-[1.6] text-graphite">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </RecordSection>

      <RecordSection kicker="Keeping it">
        <ul className="space-y-2.5 text-[16px] leading-[1.6] text-graphite">
          {PDP_CARE.map((item) => (
            <li key={item} className="border-t border-graphite/10 py-4">
              {item}
            </li>
          ))}
        </ul>
      </RecordSection>
    </div>
  );
}
