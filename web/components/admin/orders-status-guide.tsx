"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";
import {
  ADMIN_FULFILLMENT_GUIDE,
  ADMIN_ORDER_QUEUE_GUIDE,
} from "@/lib/orders/admin-order-status";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Opens a full status / queue guide — replaces the old one-line HelpTip.
 */
export function OrdersStatusGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto cursor-pointer justify-start gap-1.5 px-0 py-0 text-ink-soft hover:bg-transparent sm:px-4 sm:py-2"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <CircleHelp className="size-3.5 shrink-0" aria-hidden />
        <span className="text-sm font-medium underline decoration-transparent underline-offset-4 hover:decoration-ink/30">
          How queues work
        </span>
      </Button>

      <Modal
        open={open}
        title="How order queues work"
        onClose={() => setOpen(false)}
        panelClassName="max-w-lg"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 text-sm">
          <section>
            <h3 className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Queues
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {ADMIN_ORDER_QUEUE_GUIDE.map((queue) => (
                <li key={queue.id}>
                  <p className="font-medium text-ink">{queue.title}</p>
                  <p className="mt-0.5 text-ink-soft">{queue.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              Fulfillment path
            </h3>
            <p className="mt-2 text-ink-soft">
              Active orders move step by step. Accept Needs review first, then
              Received → Confirmed → production → ship → delivered.
            </p>
            <ol className="mt-3 flex flex-col gap-0 border-l border-ink/12 pl-4">
              {ADMIN_FULFILLMENT_GUIDE.map((step, index) => (
                <li
                  key={step.status}
                  className="relative py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="absolute -left-[1.15rem] top-3.5 size-2 rounded-full bg-ink/35 first:top-1.5"
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-mono text-label-sm text-ink-faint">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-ink">{step.label}</span>
                    {step.action ? (
                      <span className="text-ink-faint">→ {step.action}</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-ink-soft">{step.help}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Modal>
    </>
  );
}
