"use client";

import { useEffect, useState } from "react";
import type { AddressResponse } from "@ishraqparfums/shared";
import { AddressForm } from "@/components/address/address-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import {
  createAddress,
  updateAddress,
} from "@/lib/address/address-client";
import {
  addressDraftToBody,
  emptyAddressDraft,
  validateAddressDraft,
  type AddressDraft,
  type AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";

function draftFromAddress(address: AddressResponse): AddressDraft {
  return emptyAddressDraft({
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
  });
}

/**
 * Create or edit a saved address on Account.
 */
export function AddressEditModal({
  open,
  address,
  preferDefault = false,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Null = create. */
  address: AddressResponse | null;
  /** When creating the first address, seed Save as default. */
  preferDefault?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = address !== null;
  const [draft, setDraft] = useState<AddressDraft>(() => emptyAddressDraft());
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<AddressDraftErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(
      address
        ? draftFromAddress(address)
        : emptyAddressDraft({ isDefault: preferDefault }),
    );
    setAttempted(false);
    setErrors({});
    setSaving(false);
  }, [open, address, preferDefault]);

  const liveErrors = attempted ? errors : {};

  async function onSave() {
    setAttempted(true);
    const next = validateAddressDraft(draft);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const body = addressDraftToBody(draft);
      if (editing && address) {
        await updateAddress(address.id, body);
        toast.success("Address updated");
      } else {
        await createAddress(body);
        toast.success("Address saved");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        editing ? "Could not update address" : "Could not save address",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? "Edit address" : "Add address"}
      dismissible={!saving}
      onClose={onClose}
      panelClassName="max-w-xl"
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="emphasis"
            size="md"
            disabled={saving}
            className="w-full cursor-pointer sm:w-auto"
            onClick={() => {
              void onSave();
            }}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Save address"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={saving}
            className="w-full cursor-pointer text-ink-soft sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <AddressForm
        draft={draft}
        errors={liveErrors}
        disabled={saving}
        showDefaultToggle
        onChange={(next) => {
          setDraft(next);
          if (attempted) setErrors(validateAddressDraft(next));
        }}
      />
    </Modal>
  );
}
