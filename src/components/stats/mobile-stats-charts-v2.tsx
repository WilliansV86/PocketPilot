"use client";

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip, PieChartTooltip } from "@/components/charts/mobile-tooltip";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { MobileStatsSummary } from "./mobile-stats-summary";

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
          <CardContent className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-sm">No monthly cashflow data available</span>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Monthly Cashflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={chartData} 
              margin={{ top: 10, right: 5, left: 5, bottom: 50 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={70}
                fontSize={11}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                  return `$${value}`;
                }}
                fontSize={11}
                width={55}
                tick={{ fill: '#666' }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Income</div>
              <div className="text-sm font-semibold text-green-600">
                {formatCurrency(chartData.reduce((sum, item) => sum + item.income, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Expenses</div>
              <div className="text-sm font-semibold text-red-600">
                {formatCurrency(chartData.reduce((sum, item) => sum + item.expenses, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Net</div>
              <div className="text-sm font-semibold text-blue-600">
                {formatCurrency(chartData.reduce((sum, item) => sum + item.net, 0))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCategorySpending = () => {
    if (data.categorySpending.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <PieChartIcon className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-sm">No category spending data available</span>
          </CardContent>
        </Card>
      );
    }

    // Sort by amount and take top 6 for mobile
    const sortedData = [...data.categorySpending]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const chartData = sortedData.map((item, index) => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name,
      fullName: item.name,
      value: item.amount,
      color: item.color,
      // Only show percentage labels for top 3 items
      showLabel: index < 3
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-purple-600" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, showLabel }: any) => 
                  showLabel ? `${((percent || 0) * 100).toFixed(0)}%` : ''
                }
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
          
          {/* Category List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-xs text-muted-foreground font-medium px-1">
              {chartData.length} categories • Total: {formatCurrency(total)}
            </div>
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm truncate" title={item.fullName}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-muted-foreground">
                    {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.value)}
                  </span>
                </div>
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
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <DollarSign className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-sm">No account balance data available</span>
          </CardContent>
        </Card>
      );
    }

    const chartData = data.accountBalances.map(item => ({
      name: item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name,
      fullName: item.name,
      balance: item.balance,
      color: item.color,
    }));

    const total = chartData.reduce((sum, item) => sum + item.balance, 0);

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Account Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => {
                  const percentage = ((percent || 0) * 100).toFixed(0);
                  return percentage !== '0' ? `${percentage}%` : '';
                }}
                outerRadius={70}
                fill="#8884d8"
                dataKey="balance"
                fontSize={10}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Account List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-xs text-muted-foreground font-medium px-1">
              {chartData.length} accounts • Total: {formatCurrency(total)}
            </div>
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm truncate" title={item.fullName}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-muted-foreground">
                    {total > 0 ? `${((item.balance / total) * 100).toFixed(1)}%` : '0%'}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Quick Summary Cards */}
      <MobileStatsSummary 
        monthlyCashflow={data.monthlyCashflow}
        categorySpending={data.categorySpending}
        accountBalances={data.accountBalances}
      />
      
      {/* Monthly Cashflow - Full Width */}
      {renderMonthlyCashflow()}
      
      {/* Category Spending and Account Balances - Stacked on Mobile */}
      <div className="space-y-4">
        {renderCategorySpending()}
        {renderAccountBalances()}
      </div>
    </div>
  );
}
