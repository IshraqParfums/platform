import type { BespokeAdminAnalytics } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "Bespoke analytics" };

export default async function AdminBespokeAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = Math.max(1, Number(params.days) || 30);
  const data = await adminPageFetch<BespokeAdminAnalytics>(
    `/admin/bespoke/analytics?days=${days}`,
  );

  const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <AdminBackLink href="/admin/bespoke">Back to bespoke</AdminBackLink>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Bespoke funnel
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Last {data.rangeDays} days
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/admin/bespoke/analytics?days=${d}`}
              className={
                d === data.rangeDays
                  ? "font-medium text-ink"
                  : "text-ink-soft hover:text-ink"
              }
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Started" value={String(data.sessionsStarted)} />
        <Stat label="Completed" value={String(data.sessionsCompleted)} />
        <Stat label="Claimed" value={String(data.sessionsClaimed)} />
        <Stat label="Active now" value={String(data.sessionsActive)} />
        <Stat label="Completion rate" value={pct(data.completionRate)} />
        <Stat label="Claim rate" value={pct(data.claimRate)} />
        <Stat
          label="Avg questions"
          value={String(data.averageQuestionsAnswered)}
        />
        <Stat label="Expired" value={String(data.sessionsExpired)} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink/10 bg-card">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 font-mono text-label-sm uppercase text-ink-faint">
              <th className="px-3 py-2 font-medium">Node</th>
              <th className="px-3 py-2 font-medium">Sessions</th>
              <th className="px-3 py-2 font-medium">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {data.steps.map((step) => (
              <tr
                key={step.nodeId}
                className="border-b border-ink/[0.06] last:border-0"
              >
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{step.nodeText}</p>
                  <p className="font-mono text-label-sm text-ink-faint">
                    {step.nodeId}
                  </p>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                  {step.sessions}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                  {step.dropOff}
                </td>
              </tr>
            ))}
            {data.steps.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 text-center text-ink-faint"
                >
                  No funnel events in this range.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-card px-3 py-3">
      <p className="font-mono text-label-sm uppercase text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
