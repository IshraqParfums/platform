/**
 * Read-only slug on edit screens — URLs are fixed after create.
 */
export function AdminSlugReadonly({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        Slug
      </span>
      <p className="rounded-md border border-ink/10 bg-ink/[0.03] px-3 py-2.5 font-mono text-sm text-ink-soft">
        {slug}
      </p>
      <p className="text-xs text-ink-faint">
        Set at create. Changing it would break shop links.
      </p>
    </div>
  );
}
