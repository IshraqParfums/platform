import { Reveal } from "@/components/ui/reveal";

/**
 * Ritual / how-to-use steps — the `bespoke-entry.tsx` numbered `<ol>`
 * pattern, verbatim.
 */
export function ProductHowToUse({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;

  return (
    <Reveal>
      <div className="border-t border-graphite/10 pt-6">
        <p className="text-[13px] text-terra">How to wear it</p>
        <ol className="mt-4">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex items-baseline gap-4 border-t border-graphite/10 py-4"
            >
              <span className="font-ui text-[11px] font-semibold text-terra">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] font-semibold text-graphite">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
