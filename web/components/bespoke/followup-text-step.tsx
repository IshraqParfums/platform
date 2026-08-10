"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Prompt for options that carry `followup_free_text` before the answer is sent.
 */
export function FollowupTextStep({
  prompt,
  disabled,
  required = true,
  onSubmit,
  onCancel,
}: {
  prompt: string;
  disabled: boolean;
  /** False for follow-ups nothing downstream reads back — forcing an answer
   *  there is friction with no payoff, so Continue works with it left blank. */
  required?: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div>
      <p className="text-[15px] leading-relaxed text-ink-soft">
        {prompt}
        {required ? null : (
          <span className="text-ink-faint"> (optional)</span>
        )}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        disabled={disabled}
        className="mt-4 w-full rounded-xl border border-ink/12 bg-card px-4 py-3 text-[15px] text-ink outline-none focus:border-gold/50"
        autoFocus
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="emphasis"
          className="cursor-pointer"
          disabled={disabled || (required && !text.trim())}
          onClick={() => onSubmit(text.trim())}
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="cursor-pointer"
          disabled={disabled}
          onClick={onCancel}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
