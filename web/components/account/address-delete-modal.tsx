"use client";

import { useState } from "react";
import type { AddressResponse } from "@ishraqparfums/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { deleteAddress } from "@/lib/address/address-client";

export function AddressDeleteModal({
  open,
  address,
  onClose,
  onDeleted,
}: {
  open: boolean;
  address: AddressResponse | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function onConfirm() {
    if (!address) return;
    setDeleting(true);
    try {
      await deleteAddress(address.id);
      toast.success("Address removed");
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(
        "Could not remove address",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open && address !== null}
      title="Remove address?"
      dismissible={!deleting}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="emphasis"
            size="md"
            disabled={deleting}
            className="w-full cursor-pointer sm:w-auto"
            onClick={() => {
              void onConfirm();
            }}
          >
            {deleting ? "Removing…" : "Remove"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={deleting}
            className="w-full cursor-pointer text-ink-soft sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed text-ink-soft">
        {address
          ? `${address.name} — ${address.line1}, ${address.city} will be removed from your account.`
          : null}
      </p>
    </Modal>
  );
}
