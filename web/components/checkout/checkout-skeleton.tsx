import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
import {
  Skeleton,
  SkeletonScreen,
  SkeletonStack,
} from "@/components/ui/skeleton";

/**
 * Layout-faithful checkout placeholder — stacked steps matching the live page.
 */
export function CheckoutSkeleton() {
  return (
    <SkeletonScreen label="Loading checkout">
      <header className="max-w-xl">
        <SkeletonStack gap="md">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-56 sm:h-11 sm:w-64" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </SkeletonStack>
      </header>

      <div className={checkoutLayoutV2.sectionStack}>
        {/* Delivery */}
        <section className={checkoutLayoutV2.section}>
          <div className="flex items-baseline gap-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div
            className={`${checkoutLayoutV2.sectionToContent} grid gap-3 md:grid-cols-2`}
          >
            <Skeleton className="h-28 w-full" rounded="lg" />
            <Skeleton className="h-28 w-full" rounded="lg" />
          </div>
        </section>

        {/* Order / pay */}
        <section className={checkoutLayoutV2.section}>
          <div className="flex items-baseline gap-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div
            className={`${checkoutLayoutV2.sectionToContent} ${checkoutLayoutV2.panel}`}
          >
            <div className={checkoutLayoutV2.panelSplit}>
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-40 max-w-[60%]" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
              <div className={checkoutLayoutV2.panelAside}>
                <div className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="flex justify-between gap-4 border-t border-graphite/[0.08] pt-3">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <Skeleton className="mt-6 h-12 w-full" rounded="full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </SkeletonScreen>
  );
}
