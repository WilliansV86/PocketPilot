import React from "react";
import { cn } from "@/lib/utils";

// Recharts-compatible tooltip wrapper for better mobile experience
export function ChartTooltip({ 
  active, 
  payload, 
  label 
}: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-[200px] xs:max-w-[280px]">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              ${entry.value?.toFixed(2) || '0.00'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Pie chart specific tooltip
export function PieChartTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-[200px] xs:max-w-[280px]">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
          {data.name}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Amount
            </span>
          </div>
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            ${data.value?.toFixed(2) || '0.00'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Percentage
          </span>
          <span className="font-medium text-xs text-gray-900 dark:text-gray-100">
            {data.payload?.percent ? `${(data.payload.percent * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}
