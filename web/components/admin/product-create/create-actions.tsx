"use client";

import { Button } from "@/components/ui/button";
import { AdminArchivedCollectionNotice } from "@/components/admin/admin-archived-collection-notice";
import type { ProductCreateReleaseBlocker } from "@/lib/admin/product-create";

export type ProductCreateSubmitIntent = "draft" | "release";

/**
 * Dual exit: Save draft (details only) vs Create & release.
 * Archived collection is a warning, not a release blocker.
 */
export function ProductCreateActions({
  draftBlockers,
  releaseBlockers,
  canSaveDraft,
  canRelease,
  collectionArchived = false,
  submitting,
  activeIntent,
  onSubmit,
}: {
  draftBlockers: ProductCreateReleaseBlocker[];
  releaseBlockers: ProductCreateReleaseBlocker[];
  canSaveDraft: boolean;
  canRelease: boolean;
  collectionArchived?: boolean;
  submitting: boolean;
  activeIntent: ProductCreateSubmitIntent | null;
  onSubmit: (intent: ProductCreateSubmitIntent) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {!canSaveDraft && draftBlockers.length > 0 ? (
        <div className="rounded-md border border-ink/10 bg-ink/[0.03] px-3.5 py-3">
          <p className="text-sm font-medium text-ink">To save draft, still need:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {draftBlockers.map((blocker) => (
              <li key={`draft-${blocker.id}`}>{blocker.label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {canRelease ? (
        collectionArchived ? (
          <AdminArchivedCollectionNotice className="mt-0 px-3.5 py-3">
            Ready to park. Create &amp; release will hold this product until the
            collection is restored — it won&apos;t go live in the shop yet.
          </AdminArchivedCollectionNotice>
        ) : (
          <p className="text-sm text-ink-soft">
            Ready to go live. Save as a draft instead if you want to review on the
            edit page first.
          </p>
        )
      ) : (
        <div className="rounded-md border border-ink/10 bg-ink/[0.03] px-3.5 py-3">
          <p className="text-sm font-medium text-ink">
            To create &amp; release, still need:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {releaseBlockers.map((blocker) => (
              <li key={`release-${blocker.id}`}>{blocker.label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={submitting || !canSaveDraft}
          className="cursor-pointer"
          onClick={() => onSubmit("draft")}
        >
          {activeIntent === "draft" && submitting ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="emphasis"
          size="md"
          disabled={submitting || !canRelease}
          className="cursor-pointer"
          onClick={() => onSubmit("release")}
        >
          {activeIntent === "release" && submitting
            ? "Creating…"
            : "Create & release"}
        </Button>
      </div>
    </div>
  );
}
