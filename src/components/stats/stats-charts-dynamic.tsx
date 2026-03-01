"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic imports for chart components with SSR disabled
const StatsChartsComponent = dynamic(
  () => import("./stats-charts").then(mod => ({ default: mod.StatsCharts })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }
);

interface StatsChartsProps {
  type: "monthly-cashflow" | "category-spending" | "account-breakdown" | "daily-spend";
  data: any[];
  dateRange: any;
}

export function StatsChartsDynamic(props: StatsChartsProps) {
  return <StatsChartsComponent {...props} />;
}
