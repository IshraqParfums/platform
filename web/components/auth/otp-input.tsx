"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/cn";

export type OtpInputHandle = {
  /** Moves focus to the first box — for a caller resetting the code (e.g. resend). */
  focus: () => void;
};

/**
 * A one-time-code entry: `length` single-digit boxes acting as one
 * controlled value. Typing advances focus, backspace on an empty box steps
 * back and clears the box behind it, and pasting a full code (or more)
 * fills every box from the start. Purely a capture mechanism — `value` is
 * still just a string, so a caller's existing `code.trim()` logic needs no
 * change to consume it.
 *
 * `value` can carry space padding for an in-progress box the user hasn't
 * reached yet (e.g. typing into box 4 first leaves boxes 0-2 as spaces), or
 * a space left behind by clearing a filled middle box. Both mean `value`
 * can reach `length` *characters* without holding `length` *digits* —
 * completeness is therefore judged by digit count, not string length.
 */
export const OtpInput = forwardRef<OtpInputHandle, {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  /** Fires once, the instant the digit count first reaches `length`. */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}>(function OtpInput(
  { length = 6, value, onChange, onComplete, disabled, invalid, autoFocus },
  ref,
) {
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const announcedComplete = useRef(false);

  const digits = value.padEnd(length, " ").slice(0, length).split("");
  const digitCount = value.replace(/\D/g, "").length;

  useImperativeHandle(ref, () => ({
    focus: () => boxRefs.current[0]?.focus(),
  }));

  useEffect(() => {
    if (digitCount === length) {
      if (!announcedComplete.current) {
        announcedComplete.current = true;
        onComplete?.(value);
      }
    } else {
      announcedComplete.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitCount, length]);

  function setDigitAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").trimEnd());
  }

  function onBoxChange(index: number, raw: string) {
    const incoming = raw.replace(/\D/g, "");
    if (incoming.length === 0) {
      setDigitAt(index, " ");
      return;
    }

    if (incoming.length > 1) {
      // A full paste can land in any box's onChange depending on focus.
      fillFrom(0, incoming);
      return;
    }

    setDigitAt(index, incoming);
    if (index < length - 1) boxRefs.current[index + 1]?.focus();
  }

  function fillFrom(start: number, raw: string) {
    const incoming = raw.replace(/\D/g, "").slice(0, length - start);
    if (incoming.length === 0) return;

    const next = digits.slice();
    for (let i = 0; i < incoming.length; i += 1) {
      next[start + i] = incoming[i];
    }
    onChange(next.join("").trimEnd());

    const nextEmpty = Math.min(start + incoming.length, length - 1);
    boxRefs.current[nextEmpty]?.focus();
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && digits[index].trim() === "" && index > 0) {
      event.preventDefault();
      setDigitAt(index - 1, " ");
      boxRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      boxRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      boxRefs.current[index + 1]?.focus();
    }
  }

  return (
    <div role="group" aria-label="One-time code" className="flex gap-2 sm:gap-2.5">
      {digits.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            boxRefs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          value={char.trim()}
          maxLength={length}
          onChange={(event) => onBoxChange(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={(event) => {
            event.preventDefault();
            fillFrom(index, event.clipboardData.getData("text"));
          }}
          onFocus={(event) => event.currentTarget.select()}
          className={cn(
            "focus-ring-quiet size-11 rounded-[3px] border bg-paper text-center text-[19px] font-medium tabular-nums text-graphite outline-none sm:size-12",
            "transition-colors focus-visible:border-graphite/45",
            "disabled:cursor-not-allowed disabled:opacity-55",
            invalid ? "border-terra/60" : "border-graphite/20",
          )}
        />
      ))}
    </div>
  );
});
