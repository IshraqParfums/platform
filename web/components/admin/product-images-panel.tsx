"use client";

import type { AdminProductImage } from "@ishraqparfums/shared";
import { CircleHelp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import {
  AdminProductImageAddTile,
  AdminProductImageDropzone,
  AdminProductImageTile,
} from "@/components/admin/product-images";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { readAdminResponseError } from "@/lib/admin/admin-error-message";
import { moveItemInList } from "@/lib/admin/product-images/reorder";
import {
  PRODUCT_IMAGE_ACCEPT,
  validateProductImageFile,
} from "@/lib/admin/product-create/image-rules";
import { adminFetch } from "@/lib/auth/admin-fetch";

export function ProductImagesPanel({
  productId,
  images: imagesProp,
}: {
  productId: string;
  images: AdminProductImage[];
}) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(imagesProp);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductImage | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [orderGuideOpen, setOrderGuideOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** Local alt drafts so typing isn't stuck on defaultValue + blur only. */
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      imagesProp.map((image) => [image.id, image.altText ?? ""]),
    ),
  );

  useEffect(() => {
    setImages(imagesProp);
    setAltDrafts(
      Object.fromEntries(
        imagesProp.map((image) => [image.id, image.altText ?? ""]),
      ),
    );
  }, [imagesProp]);

  async function uploadFiles(files: File[]) {
    if (files.length === 0 || uploading) return;

    const accepted: File[] = [];
    for (const file of files) {
      const check = validateProductImageFile(file);
      if (!check.ok) {
        toast.error(check.reason);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setUploading(true);
    let nextOrder = images.length;
    const created: AdminProductImage[] = [];

    try {
      for (const file of accepted) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("displayOrder", String(nextOrder));

        const response = await adminFetch(
          `/api/admin/products/${productId}/images`,
          { method: "POST", body: formData },
        );

        if (!response.ok) {
          throw new Error(
            await readAdminResponseError(response, `Could not upload ${file.name}`),
          );
        }

        const image = (await response.json()) as AdminProductImage;
        created.push(image);
        nextOrder += 1;
      }

      setImages((prev) => [...prev, ...created]);
      setAltDrafts((prev) => {
        const next = { ...prev };
        for (const image of created) {
          next[image.id] = image.altText ?? "";
        }
        return next;
      });
      toast.success(
        created.length === 1
          ? "Image uploaded"
          : `${created.length} images uploaded`,
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      if (created.length > 0) router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function patchImage(
    imageId: string,
    patch: { altText?: string | null; displayOrder?: number },
  ) {
    const previous = images;
    const previousAlts = altDrafts;

    setImages((prev) =>
      prev.map((image) =>
        image.id === imageId
          ? {
              ...image,
              ...(patch.altText !== undefined ? { altText: patch.altText } : {}),
              ...(patch.displayOrder !== undefined
                ? { displayOrder: patch.displayOrder }
                : {}),
            }
          : image,
      ),
    );
    if (patch.altText !== undefined) {
      setAltDrafts((prev) => ({
        ...prev,
        [imageId]: patch.altText ?? "",
      }));
    }

    try {
      const response = await adminFetch(
        `/api/admin/products/${productId}/images/${imageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      if (!response.ok) throw new Error("Could not update image");
      const updated = (await response.json().catch(() => null)) as
        | AdminProductImage
        | null;
      if (updated) {
        setImages((prev) =>
          prev.map((image) => (image.id === imageId ? updated : image)),
        );
        setAltDrafts((prev) => ({
          ...prev,
          [imageId]: updated.altText ?? "",
        }));
      }
      router.refresh();
    } catch {
      setImages(previous);
      setAltDrafts(previousAlts);
      toast.error("Could not update image");
    }
  }

  async function commitAlt(imageId: string, value: string) {
    const image = images.find((item) => item.id === imageId);
    if (!image) return;
    const next = value.trim();
    const current = (image.altText ?? "").trim();
    if (next === current) return;
    await patchImage(imageId, { altText: next.length > 0 ? next : null });
  }

  async function persistOrder(next: AdminProductImage[]) {
    const previous = images;
    const renumbered = next.map((image, index) => ({
      ...image,
      displayOrder: index,
    }));
    setImages(renumbered);

    const changes = renumbered.filter((image, index) => {
      const before = previous.find((item) => item.id === image.id);
      return !before || before.displayOrder !== index;
    });

    try {
      for (const image of changes) {
        const response = await adminFetch(
          `/api/admin/products/${productId}/images/${image.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayOrder: image.displayOrder }),
          },
        );
        if (!response.ok) throw new Error("Could not update order");
      }
      router.refresh();
    } catch {
      setImages(previous);
      toast.error("Could not update image order");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const next = moveItemInList(images, index, direction);
    if (next) void persistOrder(next);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const removedId = deleteTarget.id;
    try {
      const response = await adminFetch(
        `/api/admin/products/${productId}/images/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok && response.status !== 204) {
        throw new Error("Could not delete image");
      }
      setImages((prev) => prev.filter((image) => image.id !== removedId));
      setAltDrafts((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
      toast.success("Image removed");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Could not delete image");
    } finally {
      setDeleting(false);
    }
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading && !dragging) setDragging(true);
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
    if (event.dataTransfer.files?.length) {
      void uploadFiles(Array.from(event.dataTransfer.files));
    }
  }

  const empty = images.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Images</h2>
          <button
            type="button"
            aria-label="About image order"
            onClick={() => setOrderGuideOpen(true)}
            className="cursor-pointer rounded-full p-0.5 text-ink-faint transition-colors hover:text-ink"
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-faint">
          First image is primary in the shop. Alt text saves when you leave the
          field. Reorder with the arrows.
        </p>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={PRODUCT_IMAGE_ACCEPT}
          multiple
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) {
              void uploadFiles(Array.from(event.target.files));
            }
            event.target.value = "";
          }}
        />

        <div className="mt-4">
          {empty ? (
            <AdminProductImageDropzone
              disabled={uploading}
              idleTitle={uploading ? "Uploading…" : "Add images"}
              onFiles={(files) => void uploadFiles(files)}
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
                    previewSrc={image.url}
                    altText={altDrafts[image.id] ?? image.altText ?? ""}
                    isPrimary={index === 0}
                    canMoveLeft={index > 0}
                    canMoveRight={index < images.length - 1}
                    disabled={uploading || deleting}
                    onAltChange={(value) =>
                      setAltDrafts((prev) => ({ ...prev, [image.id]: value }))
                    }
                    onAltCommit={(value) => void commitAlt(image.id, value)}
                    onRemove={() => setDeleteTarget(image)}
                    onMoveLeft={() => move(index, -1)}
                    onMoveRight={() => move(index, 1)}
                  />
                ))}
                <AdminProductImageAddTile
                  disabled={uploading}
                  dragging={dragging}
                  onPick={() => inputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                />
              </div>
              {uploading ? (
                <p className="mt-2 text-xs text-ink-faint">Uploading…</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <Modal
        open={orderGuideOpen}
        title="Image order"
        onClose={() => setOrderGuideOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="emphasis"
              size="md"
              onClick={() => setOrderGuideOpen(false)}
              className="cursor-pointer"
            >
              Got it
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Order controls gallery sequence. The first image is primary in the
          shop. Use the arrows to move images — order saves immediately. Alt
          text saves when you leave the field.
        </p>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Remove image"
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={deleting}
              onClick={() => void confirmDelete()}
              className="cursor-pointer"
            >
              {deleting ? "Removing…" : "Remove image"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Remove this image from the product? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
