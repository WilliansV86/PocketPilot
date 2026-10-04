"use client";

import { formatMoney } from "@/lib/currency";
import { statsDateLabel } from "@/lib/stats-date-range";
import { Badge } from "@/components/ui/badge";

interface StatsTableProps {
  currency?: string;
  data: any[];
}

export function StatsTable({ currency = "USD", data }: StatsTableProps) {
  const formatCurrency = (amount: number) => formatMoney(amount, currency);
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No spending data available for this period
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4 font-medium">Description</th>
              <th className="text-left py-2 px-4 font-medium">Category</th>
              <th className="text-left py-2 px-4 font-medium">Date</th>
              <th className="text-right py-2 px-4 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div className="font-medium">{item.description}</div>
                </td>
                <td className="py-3 px-4">
                  {item.category ? (
                    <Badge 
                      variant="secondary" 
                      style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
                    >
                      {item.category.name}
                    </Badge>
                  ) : <span className="text-muted-foreground">Uncategorized</span>}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {statsDateLabel(item.date)}
                </td>
                <td className="py-3 px-4 text-right font-medium text-red-600">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{item.description}</div>
                {item.category ? (
                  <Badge 
                    variant="secondary" 
                    className="mt-1"
                    style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
                  >
                    {item.category.name}
                  </Badge>
                ) : <span className="text-muted-foreground">Uncategorized</span>}
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {statsDateLabel(item.date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
