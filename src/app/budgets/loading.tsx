import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { CARD } from "@/lib/ui-constants";

export default function BudgetsLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-24" />
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={CARD.BASE}>
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Budget Categories */}
        <div className={CARD.BASE}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>

            {/* Budget Groups */}
            <div className="space-y-6">
              {['INCOME', 'NEEDS', 'WANTS', 'SAVINGS', 'DEBT'].map((group) => (
                <div key={group} className="space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24" />
                  </div>

                  {/* Category Items */}
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Skeleton className="h-4 w-20 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="min-h-[44px] min-w-[44px] h-11 w-11" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Budget Button */}
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-11 w-48" />
        </div>
      </div>
    </DashboardLayout>
  );
}
