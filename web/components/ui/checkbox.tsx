import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 text-sm text-ink",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-ink/30 accent-gold-deep"
      />
      {label}
    </label>
  );
}
