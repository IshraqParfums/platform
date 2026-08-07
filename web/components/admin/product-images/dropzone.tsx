"use client";

import { ImagePlus } from "lucide-react";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PRODUCT_IMAGE_ACCEPT } from "@/lib/admin/product-create/image-rules";

type AdminProductImageDropzoneProps = {
  multiple?: boolean;
  disabled?: boolean;
  draggingHint?: string;
  idleTitle?: string;
  idleHint?: ReactNode;
  onFiles: (files: File[]) => void;
  className?: string;
};

/**
 * Click / drag-and-drop surface for picking product photos.
 * Parent owns validation and create-vs-edit upload timing.
 */
export function AdminProductImageDropzone({
  multiple = true,
  disabled = false,
  draggingHint = "Drop images here",
  idleTitle = "Add images",
  idleHint = (
    <>
      Drag &amp; drop or click to browse. JPEG, PNG, or WebP — up to 5&nbsp;MB
      each.
    </>
  ),
  onFiles,
  className,
}: AdminProductImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function takeFiles(fileList: FileList | null) {
    if (disabled || !fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !dragging) setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    takeFiles(event.dataTransfer.files);
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          takeFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-ink/10 bg-ink/[0.02] opacity-60"
            : "cursor-pointer",
          !disabled &&
            (dragging
              ? "border-ink/40 bg-ink/[0.04]"
              : "border-ink/20 bg-ink/[0.02] hover:border-ink/35 hover:bg-ink/[0.03]"),
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-ink/5 text-ink">
          <ImagePlus className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="text-sm font-medium text-ink">
          {dragging ? draggingHint : idleTitle}
        </span>
        <span className="max-w-xs text-xs leading-relaxed text-ink-faint">
          {idleHint}
        </span>
      </label>
    </div>
  );
}

type AdminProductImageAddTileProps = {
  disabled?: boolean;
  dragging?: boolean;
  onPick: () => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
};

/** Compact “Add more” cell for image grids. */
export function AdminProductImageAddTile({
  disabled = false,
  dragging = false,
  onPick,
  onDragOver,
  onDragLeave,
  onDrop,
}: AdminProductImageAddTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer",
        dragging
          ? "border-ink/40 bg-ink/[0.04]"
          : "border-ink/20 bg-ink/[0.02] hover:border-ink/35 hover:bg-ink/[0.03]",
      )}
    >
      <ImagePlus className="size-5 text-ink-soft" strokeWidth={1.75} aria-hidden />
      <span className="text-xs font-medium text-ink-soft">Add more</span>
    </button>
  );
}
