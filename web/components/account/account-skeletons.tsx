import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";

/** Three cards' worth of order history. */
function OrderCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-lg border border-ink/[0.08] px-5 py-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-28" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountHubSkeleton() {
  return (
    <SkeletonScreen label="Loading your account">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-3 h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-24" rounded="full" />
      </div>

      <div className="mt-8 border-t border-ink/[0.08] pt-8">
        <Skeleton className="h-6 w-24" />
        <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="mt-8 border-t border-ink/[0.08] pt-8">
        <Skeleton className="h-6 w-20" />
        <div className="mt-5">
          <OrderCardSkeletons />
        </div>
      </div>
    </SkeletonScreen>
  );
}

export function OrdersListSkeleton() {
  return (
    <SkeletonScreen label="Loading your orders">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-3 h-3 w-24" />
      <div className="mt-8 flex gap-2">
        <Skeleton className="h-8 w-20" rounded="full" />
        <Skeleton className="h-8 w-28" rounded="full" />
        <Skeleton className="h-8 w-24" rounded="full" />
      </div>
      <div className="mt-6">
        <OrderCardSkeletons count={4} />
      </div>
    </SkeletonScreen>
  );
}

export function OrderDetailSkeleton() {
  return (
    <SkeletonScreen label="Loading your order">
      <Skeleton className="h-6 w-32" rounded="full" />
      <Skeleton className="mt-5 h-9 w-56" />
      <Skeleton className="mt-3 h-3 w-48" />

      <div className="mt-9 grid gap-4 border-y border-ink/[0.08] py-7 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-44" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-ink/[0.08] p-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)]">
          <div className="grid gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
