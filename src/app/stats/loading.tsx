import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { CARD } from "@/lib/ui-constants";

export default function StatsLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Statistics</h1>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-24" />
        </div>

        {/* Overview Cards */}
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Income vs Expenses Chart */}
          <div className={CARD.BASE}>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="h-[250px] md:h-[300px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>

          {/* Category Spending Chart */}
          <div className={CARD.BASE}>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="h-[240px] md:h-[250px]">
                <Skeleton className="h-full w-full" />
              </div>
              {/* Category Legend Skeleton */}
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories Table */}
        <div className={CARD.BASE}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>

            {/* Table Header */}
            <div className="bg-muted/50 border-b p-4 mb-2">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16 justify-self-end" />
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-3 items-center border rounded">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16 justify-self-end" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Balance Chart */}
        <div className="mt-6">
          <div className={CARD.BASE}>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="h-[240px] md:h-[250px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
