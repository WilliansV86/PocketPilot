"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, Wallet, ReceiptText, ArrowDownUp, PiggyBank, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";
import { getNetWorthStatus } from "@/lib/finance/net-worth";
import { SkeletonChart, SkeletonPieChart } from "@/components/charts/skeleton-chart";

// Dynamic imports for better performance
const MonthlyChart = dynamic(() => import("@/components/dashboard/monthly-chart-dynamic").then(mod => ({ default: mod.MonthlyChartDynamic })), {
  ssr: false,
  loading: () => <SkeletonChart height="280px" className="md:h-[350px]" />
});

const ExpenseBreakdown = dynamic(() => import("@/components/dashboard/expense-breakdown").then(mod => ({ default: mod.ExpenseBreakdown })), {
  ssr: false,
  loading: () => <SkeletonPieChart height="280px" className="md:h-[350px]" />
});

const RecentTransactions = dynamic(() => import("@/components/dashboard/recent-transactions").then(mod => ({ default: mod.RecentTransactions })), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
});

const GoalsWidget = dynamic(() => import("@/components/dashboard/goals-widget").then(mod => ({ default: mod.GoalsWidget })), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-muted animate-pulse rounded-lg" />
});

type DashboardData = {
  balanceData: {
    accounts: any[];
    totalBalance: number;
  };
  financialsData: {
    monthlyData: any[];
    current: {
      income: number;
      expenses: number;
      savings: number;
      savingsRate: number;
    };
    changes: {
      incomeChange: number;
      expensesChange: number;
      savingsRateChange: number;
    };
    uncategorizedCount: number;
  };
  expenseData: {
    categories: any[];
    totalExpenses: number;
  };
  recentTransactions: any[];
  netWorthData?: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    accountAssets: number;
    receivables: number;
    debts: number;
    accountLiabilities: number;
  };
  goalsData?: any[];
};

interface DashboardClientProps {
  data: DashboardData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Merge localStorage accounts with server accounts
  const [mergedAccounts, setMergedAccounts] = useState(data.balanceData.accounts);
  
  useEffect(() => {
    const mergeAccountData = () => {
      // Get localStorage changes
      const deletedIds = JSON.parse(localStorage.getItem('deletedAccounts') || '[]');
      const updatedAccounts = JSON.parse(localStorage.getItem('updatedAccounts') || '{}');
      const newAccounts = JSON.parse(localStorage.getItem('newAccounts') || '[]');
      
      // Filter out deleted accounts
      const filteredAccounts = data.balanceData.accounts.filter((a: any) => !deletedIds.includes(a.id));
      
      // Apply updates
      const finalAccounts = filteredAccounts.map((account: any) => {
        if (updatedAccounts[account.id]) {
          return updatedAccounts[account.id];
        }
        return account;
      });
      
      // Add new accounts
      const allAccounts = [...finalAccounts, ...newAccounts];
      
      setMergedAccounts(allAccounts);
    };
    
    mergeAccountData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      mergeAccountData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [data.balanceData.accounts]);
  
  // Calculate total balance with merged accounts
  const totalBalance = mergedAccounts.reduce((sum: number, account: any) => sum + account.balance, 0);
  
  // Format percentage changes with sign
  const formatPercentChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Net Worth Card - Spans 2 columns */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            {data.netWorthData && (
              getNetWorthStatus(data.netWorthData.netWorth) === 'positive' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : getNetWorthStatus(data.netWorthData.netWorth) === 'negative' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )
            )}
          </CardHeader>
          <CardContent>
            {data.netWorthData ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data.netWorthData.netWorth)}</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Assets: {formatCurrency(data.netWorthData.totalAssets)}</div>
                  <div>Liabilities: {formatCurrency(data.netWorthData.totalLiabilities)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">Loading...</div>
                <p className="text-xs text-muted-foreground">Calculating net worth</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">{mergedAccounts.length} active accounts</p>
          </CardContent>
        </Card>
        
        {/* Monthly Income Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <ArrowDownUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.financialsData.current.income)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentChange(data.financialsData.changes.incomeChange)} from last month
            </p>
          </CardContent>
        </Card>
        
        {/* Monthly Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ReceiptText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.financialsData.current.expenses)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentChange(data.financialsData.changes.expensesChange)} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second row for additional details */}
      {data.netWorthData && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">Account Assets</CardTitle>
              <Wallet className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatCurrency(data.netWorthData.accountAssets)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">Receivables</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatCurrency(data.netWorthData.receivables)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-3 w-3 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">{formatCurrency(data.netWorthData.totalAssets)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">Debts</CardTitle>
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatCurrency(data.netWorthData.debts)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">Account Liabilities</CardTitle>
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatCurrency(data.netWorthData.accountLiabilities)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-3 w-3 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-600">{formatCurrency(data.netWorthData.totalLiabilities)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Uncategorized Transactions Warning */}
      {data.financialsData.uncategorizedCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Uncategorized Transactions
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700">
              You have <strong>{data.financialsData.uncategorizedCount}</strong> uncategorized transaction{data.financialsData.uncategorizedCount !== 1 ? 's' : ''} this month.
              <br />
              <a href="/transactions" className="text-yellow-800 underline hover:text-yellow-900">
                Categorize them now
              </a>{' '}
              to see accurate expense tracking.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>
              Monthly financial overview for the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={data.financialsData.monthlyData} />
          </CardContent>
        </Card>
        
        <GoalsWidget goals={data.goalsData} />
        
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>
              Current month spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.expenseData.categories.length > 0 ? (
              <ExpenseBreakdown categories={data.expenseData.categories} />
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <p className="text-muted-foreground">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <RecentTransactions transactions={data.recentTransactions} />
      </div>
    </>
  );
}
