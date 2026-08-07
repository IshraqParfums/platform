/**
 * Read-only slug on edit screens — plain static text, not a field.
 */
export function AdminSlugReadonly({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        Slug
      </span>
      <p className="font-mono text-sm text-ink-soft">{slug}</p>
      <p className="text-xs text-ink-faint">
        Fixed after create — changing it would break shop links.
      </p>
    </div>
  );
}
