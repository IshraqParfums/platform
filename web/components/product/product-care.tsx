import { Reveal } from "@/components/ui/reveal";

/**
 * Care instructions — same row styling as `ProductHowToUse`'s numbered list,
 * but unordered: care items aren't sequential, so no index number.
 */
export function ProductCare({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <Reveal>
      <div className="border-t border-graphite/10 pt-6">
        <p className="text-[13px] text-terra">Care</p>
        <ul className="mt-4">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex gap-4 border-t border-graphite/10 py-4"
            >
              <span className="text-[15px] text-graphite">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
