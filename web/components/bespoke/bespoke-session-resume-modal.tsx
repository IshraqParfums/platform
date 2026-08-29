"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ResumeKind = "unfinished" | "finished";

/**
 * Overlay on the quiz: continue this device's live consultation, or start over.
 */
export function BespokeSessionResumeModal({
  open,
  kind,
  busy,
  onContinue,
  onViewResult,
  onStartNew,
}: {
  open: boolean;
  kind: ResumeKind;
  busy: boolean;
  onContinue: () => void;
  onViewResult: () => void;
  onStartNew: () => void;
}) {
  const unfinished = kind === "unfinished";

  return (
    <Modal
      open={open}
      dismissible={false}
      title={unfinished ? "You were partway through." : "Your formula is ready."}
      panelClassName="border-graphite/15 bg-paper text-graphite"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {unfinished ? (
            <Button
              type="button"
              variant="ink"
              size="pill"
              className="cursor-pointer"
              disabled={busy}
              onClick={onContinue}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              variant="ink"
              size="pill"
              className="cursor-pointer"
              disabled={busy}
              onClick={onViewResult}
            >
              View result
            </Button>
          )}
          <Button
            type="button"
            variant="outline-paper"
            size="pill"
            className="cursor-pointer"
            disabled={busy}
            onClick={onStartNew}
          >
            {busy ? "Starting…" : "Start new"}
          </Button>
        </div>
      }
    >
      <p className="text-[15px] leading-[1.55] text-graphite-soft">
        {unfinished
          ? "This device already has a consultation open. Continue where you left, or start again — the earlier one will be set aside."
          : "A blend from this device is waiting. Open it, or begin a new consultation."}
      </p>
    </Modal>
  );
}
