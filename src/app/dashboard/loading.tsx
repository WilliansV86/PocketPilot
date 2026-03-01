import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { CARD, LAYOUT } from "@/lib/ui-constants";

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={CARD.BASE}>
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Chart Card */}
          <div className={CARD.BASE}>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="h-[280px] md:h-[350px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>

          {/* Category Breakdown Card */}
          <div className={CARD.BASE}>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="h-[280px] md:h-[350px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Preview */}
        <div className={CARD.BASE}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
            
            {/* Transaction Rows */}
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
