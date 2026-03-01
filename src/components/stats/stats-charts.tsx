"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ChartTooltip, PieChartTooltip } from "@/components/charts/mobile-tooltip";

interface StatsChartsProps {
  type: "monthly-cashflow" | "category-spending" | "account-breakdown" | "daily-spend";
  data: any[];
  dateRange: any;
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
];

export function StatsCharts({ type, data, dateRange }: StatsChartsProps) {
  const renderMonthlyCashflow = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No cashflow data available for this period
        </div>
      );
    }

    const chartData = data.map(item => ({
      month: format(new Date(item.month + "-01"), "MMM yyyy"),
      income: item.income,
      expenses: item.expenses,
      net: item.net,
    }));

    return (
      <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            angle={-45}
            textAnchor="end"
            height={60}
            fontSize={12}
          />
          <YAxis 
            tickFormatter={(value) => {
              if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
              return `$${value}`;
            }}
            fontSize={12}
            width={60}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="income" fill="#10b981" name="Income" />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCategorySpending = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No category spending data available
        </div>
      );
    }

    const chartData = data.map(item => ({
      name: item.name,
      value: item.amount,
      color: item.color,
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={240} className="md:h-[250px]">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => {
                const displayName = (name || '').length > 10 ? (name || '').substring(0, 10) + "..." : (name || '');
                return `${displayName} ${((percent || 0) * 100).toFixed(0)}%`;
              }}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              fontSize={10}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Category Legend */}
        <div className="grid grid-cols-1 gap-2 text-sm max-h-48 overflow-y-auto">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-muted-foreground">
                  {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          Total: {formatCurrency(total)}
        </div>
      </div>
    );
  };

  const renderAccountBreakdown = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No account data available
        </div>
      );
    }

    const chartData = data.map(item => ({
      name: item.name,
      value: item.balance,
      color: item.color,
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={240} className="md:h-[250px]">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Account Legend */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate" title={item.name}>
                  {item.name}
                </span>
                <span className="text-xs text-muted-foreground">({(item as any).type})</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-muted-foreground">
                  {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          Total: {formatCurrency(total)}
        </div>
      </div>
    );
  };

  const renderDailySpend = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No daily spending data available for this month
        </div>
      );
    }

    const chartData = data.map(item => ({
      date: format(new Date(item.date), "MMM dd"),
      amount: item.amount,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            formatter={(value: number | undefined) => [formatCurrency(value || 0), "Daily Spending"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ fill: "#ef4444", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  switch (type) {
    case "monthly-cashflow":
      return renderMonthlyCashflow();
    case "category-spending":
      return renderCategorySpending();
    case "account-breakdown":
      return renderAccountBreakdown();
    case "daily-spend":
      return renderDailySpend();
    default:
      return <div>Unknown chart type</div>;
  }
}
