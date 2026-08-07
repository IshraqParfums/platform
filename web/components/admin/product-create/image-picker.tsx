"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import {
  AdminProductImageAddTile,
  AdminProductImageDropzone,
  AdminProductImageTile,
} from "@/components/admin/product-images";
import { PRODUCT_IMAGE_ACCEPT } from "@/lib/admin/product-create/image-rules";
import { moveItemInList } from "@/lib/admin/product-images/reorder";

export type ProductCreateImageDraft = {
  id: string;
  file: File;
  previewUrl: string;
  /** Local only until create submit uploads the file. */
  altText: string;
};

/**
 * Create-flow image drafts — alt/order stay in memory.
 * No blur API save (there is no server image yet).
 */
export function ProductCreateImagePicker({
  images,
  onAppend,
  onRemove,
  onAltChange,
  onReorder,
}: {
  images: ProductCreateImageDraft[];
  onAppend: (files: File[]) => void;
  onRemove: (id: string) => void;
  onAltChange: (id: string, altText: string) => void;
  onReorder: (next: ProductCreateImageDraft[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function takeFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onAppend(Array.from(fileList));
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!dragging) setDragging(true);
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (
      event.currentTarget instanceof HTMLElement &&
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setDragging(false);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    takeFiles(event.dataTransfer.files);
  }

  function move(index: number, direction: -1 | 1) {
    const next = moveItemInList(images, index, direction);
    if (next) onReorder(next);
  }

  const empty = images.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(event) => {
          takeFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {empty ? (
        <AdminProductImageDropzone
          onFiles={onAppend}
          idleHint={
            <>
              Drag &amp; drop or click to browse. JPEG, PNG, or WebP — up to
              5&nbsp;MB each. First image is primary. Alt text is optional until
              release.
            </>
          }
        />
      ) : (
        <>
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {images.map((image, index) => (
              <AdminProductImageTile
                key={image.id}
                previewSrc={image.previewUrl}
                altText={image.altText}
                isPrimary={index === 0}
                canMoveLeft={index > 0}
                canMoveRight={index < images.length - 1}
                caption={image.file.name}
                onAltChange={(value) => onAltChange(image.id, value)}
                onRemove={() => onRemove(image.id)}
                onMoveLeft={() => move(index, -1)}
                onMoveRight={() => move(index, 1)}
              />
            ))}
            <AdminProductImageAddTile
              dragging={dragging}
              onPick={openPicker}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          </div>
          <p className="text-xs text-ink-faint">
            {dragging
              ? "Drop to add more images"
              : "First image is primary. Reorder with the arrows. Alt stays on this draft until you save."}
          </p>
        </>
      )}
    </div>
  );
}
