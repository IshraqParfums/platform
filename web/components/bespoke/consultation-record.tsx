import { Urdu } from "@/components/home-v2/ui/urdu";

export type RecordEntry = { id: string; question: string; answer: string };

/**
 * Every answer so far, compact. Lives in the paper-deep band under the
 * live question so the question does not get pushed down.
 */
export function ConsultationRecord({
  entries,
  urdu,
}: {
  entries: RecordEntry[];
  urdu?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="relative">
      {urdu ? (
        <Urdu size="sm" tone="brass" align="start" className="mb-1">
          {urdu}
        </Urdu>
      ) : null}

      <ol className="border-l border-graphite/12 pl-4">
        {entries.map((entry, i) => (
          <li
            key={entry.id}
            className={
              "relative py-1.5 " +
              (i === entries.length - 1 ? "record-settle" : "")
            }
          >
            <span
              aria-hidden="true"
              className="absolute -left-[17px] top-[0.95em] h-px w-2.5 bg-terra/70"
            />
            <p className="text-[11px] leading-[1.35] text-graphite-faint">
              {entry.question}
            </p>
            <p className="mt-0.5 font-editorial text-[16px] leading-[1.25] text-graphite">
              {entry.answer}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
