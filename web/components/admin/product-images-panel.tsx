"use client";

import type { AdminProductImage } from "@ishraqparfums/shared";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";

export function ProductImagesPanel({
  productId,
  images,
}: {
  productId: string;
  images: AdminProductImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductImage | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function upload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an image file first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("displayOrder", String(images.length));

      const response = await adminFetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Upload failed");
      }

      toast.success("Image uploaded");
      if (fileInputRef.current) fileInputRef.current.value = "";
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function updateImage(
    imageId: string,
    patch: { altText?: string; displayOrder?: number },
  ) {
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
      refresh();
    } catch {
      toast.error("Could not update image");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await adminFetch(
        `/api/admin/products/${productId}/images/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!response.ok && response.status !== 204) {
        throw new Error("Could not delete image");
      }
      toast.success("Image removed");
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Could not delete image");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-dashed border-ink/20 bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Upload</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Add a product photo. PNG or JPG works best.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            className="cursor-pointer"
            onClick={() => void upload()}
          >
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Uploaded images
        </h2>
        {images.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">No images yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-ink/5">
                  <Image
                    src={image.url}
                    alt={image.altText ?? ""}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <Input
                  defaultValue={image.altText ?? ""}
                  placeholder="Alt text"
                  className="text-xs"
                  onBlur={(event) => {
                    if (event.target.value !== (image.altText ?? "")) {
                      void updateImage(image.id, {
                        altText: event.target.value || undefined,
                      });
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    defaultValue={image.displayOrder}
                    className="text-xs"
                    aria-label="Display order"
                    onBlur={(event) => {
                      const value = Number(event.target.value);
                      if (value !== image.displayOrder) {
                        void updateImage(image.id, { displayOrder: value });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setDeleteTarget(image)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
