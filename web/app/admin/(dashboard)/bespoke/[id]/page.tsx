import type { BespokePerfumeAdminResponse } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { BespokeComposition } from "@/components/admin/bespoke/bespoke-composition";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { formatBespokeAnswerLog } from "@/lib/admin/bespoke-answer-log";
import { NestApiError } from "@/lib/api/errors";
import { formatOrderDateTime } from "@/lib/orders/order-status";

export const metadata: Metadata = { title: "Bespoke blend" };

type RouteParams = { params: Promise<{ id: string }> };

export default async function AdminBespokeDetailPage({ params }: RouteParams) {
  const { id } = await params;

  let brew: BespokePerfumeAdminResponse;
  try {
    brew = await adminPageFetch<BespokePerfumeAdminResponse>(
      `/admin/bespoke/${id}`,
    );
  } catch (error) {
    if (
      error instanceof NestApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound();
    }
    throw error;
  }

  const answerLog = formatBespokeAnswerLog(brew.state);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <AdminBackLink href="/admin/bespoke">Back to bespoke</AdminBackLink>
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {brew.name}
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          Engine {brew.engineVersion} · graph {brew.graphVersion} ·{" "}
          {formatOrderDateTime(brew.createdAt)}
          {brew.deletedAt ? " · soft-deleted" : ""}
        </p>
        {brew.dedication ? (
          <p className="mt-2 text-sm italic text-ink-soft">{brew.dedication}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4">
        <BespokeComposition formula={brew.formula} answerLog={answerLog} />
      </div>
    </div>
  );
}
