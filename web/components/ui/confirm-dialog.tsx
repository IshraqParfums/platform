"use client";

import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * "Are you sure?" dialog: a sentence, a confirm, a cancel.
 *
 * Wraps `Modal` rather than extending it — the confirm/cancel footer, the
 * pending label swap and the "can't dismiss mid-flight" rule are one
 * recurring *shape*, not new chrome, and every place that hand-rolls them
 * gets a chance to forget the last one. Callers supply copy and the action.
 *
 * Pending state is owned by the caller, not held here: the trigger that
 * opened the dialog almost always has to disable itself for the same window,
 * so a second copy of the flag inside would immediately need syncing back
 * out. `onConfirm` may be sync or async; this component never awaits it and
 * never closes itself, because only the caller knows whether success means
 * closing, navigating away, or leaving the dialog up with an error.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  confirmVariant = "ink",
  pending = false,
  theme = "v2",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  /** The consequence, in plain words. */
  children: ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while `pending`. Falls back to `confirmLabel`. */
  pendingLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  pending?: boolean;
  theme?: "v1" | "v2";
  onConfirm: () => void;
  onClose: () => void;
}) {
  // A dismissal mid-flight would strand the action with no way to report back.
  const close = () => {
    if (!pending) onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
      dismissible={!pending}
      theme={theme}
      onClose={close}
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant={confirmVariant}
            size="md"
            disabled={pending}
            className="w-full cursor-pointer sm:w-auto"
            onClick={onConfirm}
          >
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={pending}
            className="w-full cursor-pointer text-graphite-soft sm:w-auto"
            onClick={close}
          >
            {cancelLabel}
          </Button>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed text-graphite-soft">{children}</p>
    </Modal>
  );
}
