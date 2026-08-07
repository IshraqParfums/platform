import {
  Skeleton,
  SkeletonScreen,
  SkeletonStack,
} from "@/components/ui/skeleton";

export function BespokeBrewSkeleton() {
  return (
    <SkeletonScreen label="Loading blend">
      <Skeleton className="h-3 w-24" />
      <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <Skeleton className="h-40 w-24 shrink-0 rounded-[45%]" />
        <SkeletonStack gap="md" className="min-w-0 flex-1">
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-sm" />
        </SkeletonStack>
      </div>
      <div className="mt-8 rounded-lg border border-ink/12 px-5 py-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28" rounded="full" />
          <Skeleton className="h-10 w-28" rounded="full" />
          <Skeleton className="h-10 w-32" rounded="full" />
        </div>
        <Skeleton className="mt-5 h-12 w-40" rounded="full" />
      </div>
    </SkeletonScreen>
  );
}

export function BespokeSavedSkeleton() {
  return (
    <div
      className="grid gap-3"
      role="status"
      aria-live="polite"
      aria-label="Loading saved blends"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-lg border border-ink/12 px-5 py-4"
        >
          <Skeleton className="hidden h-16 w-2 shrink-0 rounded-full sm:block" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Skeleton className="h-9 w-20" rounded="full" />
            <Skeleton className="h-9 w-20" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}
