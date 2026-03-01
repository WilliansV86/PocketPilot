"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { COMPONENTS, TYPOGRAPHY } from "@/lib/theme/tokens";

// Table skeleton loader
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full overflow-auto">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex gap-4 p-4 border-b bg-muted/50">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 w-20" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4 border-b">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`h-4 ${colIndex === columns - 1 ? 'w-16' : 'w-24'}`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Card skeleton loader
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`card-${i}`} className={COMPONENTS.CARD.CONTAINER}>
          <div className={COMPONENTS.CARD.HEADER}>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className={COMPONENTS.CARD.CONTENT}>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// List skeleton loader
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={`item-${i}`} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// Stats skeleton loader
export function StatsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={`stat-${i}`} className={COMPONENTS.CARD.COMPACT}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton loader
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  );
}

// Page skeleton loader
export function PageSkeleton({ 
  showHeader = true, 
  showStats = false, 
  showTable = true,
  showCards = false 
}: {
  showHeader?: boolean;
  showStats?: boolean;
  showTable?: boolean;
  showCards?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      
      {/* Stats Cards */}
      {showStats && <StatsSkeleton />}
      
      {/* Content Cards */}
      {showCards && <CardSkeleton />}
      
      {/* Table */}
      {showTable && <TableSkeleton />}
    </div>
  );
}
