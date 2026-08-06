import { checkoutLayout } from "@/components/checkout/checkout-layout";
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
          <Skeleton className="h-10 w-44 sm:h-11 sm:w-52" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </SkeletonStack>
      </header>

      <div className={checkoutLayout.sectionStack}>
        {/* Delivery */}
        <section className={checkoutLayout.section}>
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className={`${checkoutLayout.sectionToContent} grid gap-3 md:grid-cols-2`}>
            <Skeleton className="h-28 w-full" rounded="lg" />
            <Skeleton className="h-28 w-full" rounded="lg" />
          </div>
        </section>

        {/* Order / pay */}
        <section className={checkoutLayout.section}>
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div
            className={`${checkoutLayout.sectionToContent} ${checkoutLayout.panel}`}
          >
            <div className={checkoutLayout.panelSplit}>
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-40 max-w-[60%]" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
              <div className={checkoutLayout.panelAside}>
                <div className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="flex justify-between gap-4 border-t border-ink/[0.08] pt-3">
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
