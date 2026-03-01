"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import for monthly chart with SSR disabled
const MonthlyChartComponent = dynamic(
  () => import("./monthly-chart").then(mod => ({ default: mod.MonthlyChart })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
  }
);

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

interface MonthlyChartProps {
  data: MonthlyData[];
}

export function MonthlyChartDynamic(props: MonthlyChartProps) {
  return <MonthlyChartComponent {...props} />;
}
