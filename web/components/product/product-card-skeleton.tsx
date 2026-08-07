import { Skeleton, SkeletonScreen, SkeletonStack } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/** Shimmer stand-in for a catalog product card while shop filters refresh. */
export function ProductCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <Skeleton
        variant="shimmer"
        rounded="lg"
        className="aspect-[4/5] w-full !rounded-2xl"
      />
      <SkeletonStack gap="sm" className="mt-3">
        <Skeleton variant="shimmer" className="h-5 w-3/4" />
        <Skeleton variant="shimmer" className="h-3 w-1/2" />
        <Skeleton variant="shimmer" className="h-3 w-full" />
        <Skeleton variant="shimmer" className="mt-1 h-5 w-2/5" />
      </SkeletonStack>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <SkeletonScreen label="Loading products" className={className}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-12">
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonScreen>
  );
}
