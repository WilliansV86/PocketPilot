import { Skeleton } from "@/components/ui/loading-skeleton";
import { CARD } from "@/lib/ui-constants";

interface SkeletonChartProps {
  height?: string;
  className?: string;
}

export function SkeletonChart({ height = "280px", className }: SkeletonChartProps) {
  return (
    <div className={CARD.BASE}>
      <div className="p-6 space-y-4">
        {/* Chart Title Skeleton */}
        <Skeleton className="h-6 w-32" />
        
        {/* Chart Area Skeleton */}
        <div 
          className={`relative ${className}`}
          style={{ height }}
        >
          <Skeleton className="h-full w-full" />
          
          {/* Simulate chart elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full flex flex-col justify-between p-4">
              {/* Simulate bars */}
              <div className="flex items-end justify-between h-full gap-2">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-muted rounded-t"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend Skeleton */}
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SkeletonPieChartProps {
  height?: string;
  className?: string;
}

export function SkeletonPieChart({ height = "250px", className }: SkeletonPieChartProps) {
  return (
    <div className={CARD.BASE}>
      <div className="p-6 space-y-4">
        {/* Chart Title Skeleton */}
        <Skeleton className="h-6 w-40" />
        
        {/* Pie Chart Area Skeleton */}
        <div 
          className={`relative ${className}`}
          style={{ height }}
        >
          <Skeleton className="h-full w-full rounded-full" />
          
          {/* Simulate pie slices */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/20" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />
              <div className="absolute inset-0 bg-secondary/30" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)' }} />
            </div>
          </div>
        </div>
        
        {/* Legend Skeleton */}
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
  );
}
