import {
  Skeleton,
  SkeletonScreen,
  SkeletonStack,
} from "@/components/ui/skeleton";

/**
 * Layout-faithful cart placeholder — same two-column grid as the loaded cart.
 */
export function CartSkeleton() {
  return (
    <SkeletonScreen label="Loading your cart">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,21rem)] lg:items-start lg:gap-14 xl:gap-20">
        <div className="min-w-0">
          <header className="max-w-xl">
            <SkeletonStack gap="md">
              <Skeleton className="h-10 w-48 sm:h-11 sm:w-56" />
              <Skeleton className="h-5 w-72 max-w-full" />
              <Skeleton className="h-3 w-40" />
            </SkeletonStack>
          </header>

          <div className="mt-10 divide-y divide-graphite/[0.08] border-y border-graphite/[0.08]">
            {Array.from({ length: 3 }, (_, index) => (
              <CartLineSkeleton key={index} />
            ))}
          </div>
        </div>

        <aside className="rounded-[4px] border border-graphite/10 bg-shell p-6 sm:p-7 lg:sticky lg:top-24 lg:self-start">
          <Skeleton className="h-7 w-28" />
          <div className="mt-7 space-y-4">
            <div className="flex justify-between gap-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex justify-between gap-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex justify-between gap-6 border-t border-graphite/[0.08] pt-4">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="mt-8 h-12 w-full" rounded="full" />
          <SkeletonStack gap="sm" className="mt-6">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-28" />
          </SkeletonStack>
        </aside>
      </div>
    </SkeletonScreen>
  );
}

function CartLineSkeleton() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-4 py-8 sm:gap-x-7 sm:py-9">
      <Skeleton
        className="h-[6.5rem] w-[6.5rem] sm:h-32 sm:w-32"
        rounded="lg"
      />
      <div className="min-w-0">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-5 w-44 max-w-full" />
        <Skeleton className="mt-2 h-4 w-24" />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-9 w-28" rounded="full" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}
