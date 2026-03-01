import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { CARD } from "@/lib/ui-constants";

export default function TransactionsLoading() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <Skeleton className="h-11 w-32" />
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-24" />
        </div>

        {/* Transactions Table */}
        <div className={CARD.BASE}>
          <div className="rounded-xl border bg-card overflow-x-auto">
            {/* Table Header */}
            <div className="bg-muted/50 border-b p-4">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 justify-self-end" />
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/30 transition-colors md:py-2 py-3">
                  {/* Date */}
                  <Skeleton className="h-4 w-16" />
                  
                  {/* Description */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  
                  {/* Account */}
                  <Skeleton className="h-4 w-20" />
                  
                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  
                  {/* Amount & Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="min-h-[44px] min-w-[44px] h-11 w-11" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
