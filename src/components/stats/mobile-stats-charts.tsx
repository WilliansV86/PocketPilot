"use client";

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip, PieChartTooltip } from "@/components/charts/mobile-tooltip";
import { formatCurrency } from "@/lib/format";

type StatsData = {
  monthlyCashflow: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  categorySpending: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  accountBalances: Array<{
    name: string;
    balance: number;
    color: string;
  }>;
};

interface MobileStatsChartsProps {
  data: StatsData;
}

export function MobileStatsCharts({ data }: MobileStatsChartsProps) {
  const renderMonthlyCashflow = () => {
    if (data.monthlyCashflow.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
            No monthly cashflow data available
          </CardContent>
        </Card>
      );
    }

    const chartData = data.monthlyCashflow.map(item => ({
      month: format(new Date(item.month + "-01"), "MMM"),
      income: item.income,
      expenses: item.expenses,
      net: item.net,
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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
                tickFormatter={(value) => `$${value}`}
                fontSize={12}
                width={60}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderCategorySpending = () => {
    if (data.categorySpending.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
            No category spending data available
          </CardContent>
        </Card>
      );
    }

    const chartData = data.categorySpending.map(item => ({
      name: item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name,
      fullName: item.name,
      value: item.amount,
      color: item.color,
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Spending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={60}
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
          
          {/* Category Legend */}
          <div className="grid grid-cols-1 gap-2 text-sm max-h-32 overflow-y-auto">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate" title={item.fullName}>
                    {item.name}
                  </span>
                </div>
                <span className="font-medium ml-auto">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAccountBalances = () => {
    if (data.accountBalances.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
            No account balance data available
          </CardContent>
        </Card>
      );
    }

    const chartData = data.accountBalances.map(item => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name,
      fullName: item.name,
      balance: item.balance,
      color: item.color,
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="balance"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Account Legend */}
          <div className="grid grid-cols-1 gap-2 text-sm max-h-32 overflow-y-auto">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate" title={item.fullName}>
                    {item.name}
                  </span>
                </div>
                <span className="font-medium ml-auto">
                  {formatCurrency(item.balance)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderMonthlyCashflow()}
      <div className="grid grid-cols-1 gap-4">
        {renderCategorySpending()}
        {renderAccountBalances()}
      </div>
    </div>
  );
}
