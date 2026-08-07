"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No results.",
  className,
  loading = false,
  skeletonRowCount = 3,
  skeletonColumnWidths,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
  skeletonRowCount?: number;
  /** Per-column bar widths (e.g. "45%"). Cycles if shorter than column count. */
  skeletonColumnWidths?: string[];
}) {
  const table = useReactTable({
    data: loading ? [] : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const columnCount = columns.length;

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-ink/10", className)}>
      <table className="w-full min-w-full border-collapse text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-ink/10 bg-ink/[0.03]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-4 py-3 font-mono text-label-sm uppercase tracking-wide text-ink-faint"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
              <tr
                key={`skeleton-${rowIndex}`}
                className="border-b border-ink/[0.06] last:border-0"
              >
                {Array.from({ length: columnCount }, (_, colIndex) => {
                  const width =
                    skeletonColumnWidths?.[colIndex % skeletonColumnWidths.length] ??
                    "55%";
                  return (
                    <td key={colIndex} className="px-4 py-3 align-middle">
                      <Skeleton
                        variant="shimmer"
                        className="h-3.5 max-w-full"
                        style={{ width }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-10 text-center text-ink-faint">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  "border-b border-ink/[0.06] last:border-0",
                  onRowClick && "cursor-pointer hover:bg-ink/[0.03]",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle text-ink">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
