"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingUp, DollarSign, Calendar } from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { PATTERNS, TYPOGRAPHY, BUTTON, SPACING, LAYOUT } from "@/lib/ui-constants";
import { StatsTable } from "@/components/stats/stats-table";
import { getDateRangePreset, type DateRange } from "@/lib/actions/stats";
import { SkeletonChart, SkeletonPieChart } from "@/components/charts/skeleton-chart";
import { MobileStatsCharts } from "@/components/stats/mobile-stats-charts-v2";

// Dynamic import for stats charts with loading state
const StatsCharts = dynamic(() => import("@/components/stats/stats-charts-dynamic").then(mod => ({ default: mod.StatsChartsDynamic })), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <SkeletonChart height="250px" className="md:h-[300px]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonPieChart height="240px" className="md:h-[250px]" />
        <SkeletonPieChart height="240px" className="md:h-[250px]" />
      </div>
    </div>
  )
});

export function StatsClient() {
  const [selectedRange, setSelectedRange] = useState("this_month");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangePreset("this_month"));
  const [data, setData] = useState<any>({
    monthlyCashflow: [],
    categorySpending: [],
    accountBreakdown: [],
    dailySpend: [],
    topSpending: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const range = getDateRangePreset(selectedRange);
      setDateRange(range);

      const [
        monthlyCashflowRes,
        categorySpendingRes,
        accountBreakdownRes,
        dailySpendRes,
        topSpendingRes,
      ] = await Promise.all([
        fetch("/api/stats/monthly-cashflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: selectedRange }),
        }).then(res => res.json()),
        fetch("/api/stats/category-spending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: selectedRange }),
        }).then(res => res.json()),
        fetch("/api/stats/account-breakdown").then(res => res.json()),
        fetch("/api/stats/daily-spend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: "this_month" }),
        }).then(res => res.json()),
        fetch("/api/stats/top-spending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: selectedRange }),
        }).then(res => res.json()),
      ]);

      setData({
        monthlyCashflow: monthlyCashflowRes.success ? monthlyCashflowRes.data : [],
        categorySpending: categorySpendingRes.success ? categorySpendingRes.data : [],
        accountBreakdown: accountBreakdownRes.success ? accountBreakdownRes.data : [],
        dailySpend: dailySpendRes.success ? dailySpendRes.data : [],
        topSpending: topSpendingRes.success ? topSpendingRes.data : [],
      });
    } catch (error) {
      console.error("Error loading stats data:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasData = data.monthlyCashflow.length > 0 || 
                 data.categorySpending.length > 0 || 
                 data.accountBreakdown.length > 0;

  return (
    <div className={PATTERNS.PAGE_CONTENT}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={TYPOGRAPHY.PAGE_TITLE}>Financial Statistics</h1>
          <p className={TYPOGRAPHY.SECTION_SUBTITLE}>
            Insights and analytics about your financial performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h2 className={TYPOGRAPHY.SECTION_TITLE}>Loading Statistics...</h2>
            <p className={TYPOGRAPHY.SECTION_SUBTITLE}>Please wait while we analyze your financial data</p>
          </div>
        </div>
      ) : !hasData ? (
        <EmptyState
          icon="📊"
          title="No Data Available"
          description="Add transactions to see insights and statistics about your financial performance"
          action={{
            label: "Add Transaction",
            onClick: () => window.location.href = "/transactions/new"
          }}
        />
      ) : (
        <div className={SPACING.SPACE_Y.LARGE}>
          {/* Mobile Layout */}
          <div className="md:hidden">
            <MobileStatsCharts 
              data={{
                monthlyCashflow: data.monthlyCashflow,
                categorySpending: data.categorySpending,
                accountBalances: data.accountBreakdown
              }} 
            />
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
          {/* Charts Grid */}
          <div className={LAYOUT.GRID.CHARTS}>
            {/* Monthly Cashflow */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Cashflow
                </CardTitle>
                <CardDescription>
                  Income vs expenses over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsCharts
                  type="monthly-cashflow"
                  data={data.monthlyCashflow}
                  dateRange={dateRange}
                />
              </CardContent>
            </Card>

            {/* Category Spending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Spending by Category
                </CardTitle>
                <CardDescription>
                  Expense breakdown for {dateRange.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsCharts
                  type="category-spending"
                  data={data.categorySpending}
                  dateRange={dateRange}
                />
              </CardContent>
            </Card>

            {/* Account Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Account Breakdown
                </CardTitle>
                <CardDescription>
                  Current balances across all accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsCharts
                  type="account-breakdown"
                  data={data.accountBreakdown}
                  dateRange={dateRange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Daily Spend Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Spending Trend
              </CardTitle>
              <CardDescription>
                Daily expense totals for the current month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatsCharts
                type="daily-spend"
                data={data.dailySpend}
                dateRange={getDateRangePreset("this_month")}
              />
            </CardContent>
          </Card>

          {/* Top Spending Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Top Spending
              </CardTitle>
              <CardDescription>
                Highest expenses for {dateRange.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatsTable data={data.topSpending} />
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
