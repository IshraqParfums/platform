"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { shouldUnoptimizeImageSrc } from "@/lib/media/unoptimize-image-src";

export type AdminProductImageTileProps = {
  previewSrc: string;
  altText: string;
  isPrimary: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  /** Optional filename caption (create drafts). */
  caption?: string;
  disabled?: boolean;
  /**
   * Local value change — create drafts only use this.
   * Edit also uses it for controlled UI while typing.
   */
  onAltChange: (value: string) => void;
  /**
   * Persist when focus leaves. Edit only — create must omit this
   * (no server image yet).
   */
  onAltCommit?: (value: string) => void;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
};

/**
 * Shared admin image tile: preview, primary badge, reorder, alt, remove.
 * Persistence strategy is caller-owned via onAltChange vs onAltCommit.
 */
export function AdminProductImageTile({
  previewSrc,
  altText,
  isPrimary,
  canMoveLeft,
  canMoveRight,
  caption,
  disabled = false,
  onAltChange,
  onAltCommit,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: AdminProductImageTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-ink/10 bg-card p-2",
        disabled && "opacity-60",
      )}
    >
      <div className="group relative aspect-square overflow-hidden rounded-md bg-ink/5">
        <Image
          src={previewSrc}
          alt={altText || caption || ""}
          fill
          sizes="200px"
          unoptimized={shouldUnoptimizeImageSrc(previewSrc)}
          className="object-cover"
        />
        {isPrimary ? (
          <span className="absolute left-2 top-2 rounded-full bg-deep/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cream">
            Primary
          </span>
        ) : null}
        <button
          type="button"
          aria-label="Remove image"
          disabled={disabled}
          className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-full bg-deep/75 text-cream opacity-100 transition-opacity hover:bg-deep disabled:cursor-not-allowed sm:opacity-0 sm:group-hover:opacity-100"
          onClick={onRemove}
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
        {caption ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-deep/70 to-transparent px-2 pb-1.5 pt-6 text-[11px] text-cream/90">
            {caption}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label="Move earlier"
          disabled={disabled || !canMoveLeft}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-ink/15 text-ink-soft transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onMoveLeft}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          {isPrimary ? "Shows first" : "Gallery"}
        </span>
        <button
          type="button"
          aria-label="Move later"
          disabled={disabled || !canMoveRight}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-ink/15 text-ink-soft transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onMoveRight}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          Alt text
        </span>
        <Input
          value={altText}
          disabled={disabled}
          placeholder="Describe this photo"
          className="px-2.5 py-2 text-xs"
          onChange={(event) => onAltChange(event.target.value)}
          onBlur={(event) => {
            onAltCommit?.(event.target.value);
          }}
        />
      </label>
    </div>
  );
}
