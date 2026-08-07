"use client";

import type { AdminCustomerSummary } from "@ishraqparfums/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { adminFetch } from "@/lib/auth/admin-fetch";

export function CustomerEditForm({ customer }: { customer: AdminCustomerSummary }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  async function confirmSave() {
    setSubmitting(true);
    try {
      const response = await adminFetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Could not save customer");
      }

      toast.success("Customer saved");
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Name
            </span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Email
            </span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Phone
            </span>
            <Input value={customer.phone} disabled />
          </label>
        </div>

        <div>
          <Button
            type="submit"
            variant="emphasis"
            size="md"
            disabled={submitting}
            className="cursor-pointer"
          >
            Save changes
          </Button>
        </div>
      </form>

      <Modal
        open={confirmOpen}
        title="Update customer profile"
        onClose={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={submitting}
              onClick={() => void confirmSave()}
              className="cursor-pointer"
            >
              {submitting ? "Saving…" : "Update profile"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">
          Update profile used on receipts and order communications?
        </p>
      </Modal>
    </>
  );
}
