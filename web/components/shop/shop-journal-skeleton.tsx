import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton";

function JournalCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-6">
      <Skeleton
        variant="shimmer"
        className="aspect-[4/5] w-full !rounded-none bg-graphite/[0.06]"
      />
      <div className="flex flex-col gap-3 sm:pt-1">
        <Skeleton variant="shimmer" className="h-7 w-2/3 bg-graphite/[0.06]" />
        <Skeleton variant="shimmer" className="h-4 w-1/3 bg-graphite/[0.06]" />
        <Skeleton variant="shimmer" className="mt-2 h-4 w-full max-w-[28ch] bg-graphite/[0.06]" />
        <Skeleton variant="shimmer" className="mt-3 h-5 w-24 bg-graphite/[0.06]" />
      </div>
    </div>
  );
}

export function ShopJournalSkeleton({
  count = 4,
}: {
  count?: number;
}) {
  return (
    <SkeletonScreen label="Loading products">
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2 md:gap-y-14">
        {Array.from({ length: count }, (_, i) => (
          <JournalCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonScreen>
  );
}
