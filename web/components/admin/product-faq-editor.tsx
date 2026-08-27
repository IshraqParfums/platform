"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductFaqDraft = {
  question: string;
  answer: string;
};

/**
 * Minimal add/remove row editor for FAQ question/answer pairs. FAQ is the
 * one PDP content field that's a variable-length list of *objects* — every
 * other list field is one line/item per row in a `Textarea` or a
 * comma-separated `Input`, which doesn't fit a question+answer pair. This is
 * a controlled component: the caller (create/edit form) owns the array,
 * this only renders rows and reports changes. No drag-reorder, no fancy
 * interaction — same `Input`/label/`Button` classes already used elsewhere
 * in the admin product forms.
 */
export function ProductFaqEditor({
  value,
  onChange,
}: {
  value: ProductFaqDraft[];
  onChange: (next: ProductFaqDraft[]) => void;
}) {
  function addRow() {
    onChange([...value, { question: "", answer: "" }]);
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function patchRow(index: number, patch: Partial<ProductFaqDraft>) {
    onChange(
      value.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 ? (
        <p className="text-sm text-ink-faint">No questions yet.</p>
      ) : (
        value.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-md border border-ink/10 p-3 sm:flex-row sm:items-start"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                  Question
                </span>
                <Input
                  value={row.question}
                  onChange={(event) =>
                    patchRow(index, { question: event.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                  Answer
                </span>
                <Input
                  value={row.answer}
                  onChange={(event) =>
                    patchRow(index, { answer: event.target.value })
                  }
                />
              </label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 cursor-pointer"
              onClick={() => removeRow(index)}
            >
              Remove
            </Button>
          </div>
        ))
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={addRow}
        >
          Add question
        </Button>
      </div>
    </div>
  );
}
