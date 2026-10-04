"use client";

import { NetWorthHistory } from "@/components/dashboard/net-worth-history";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, Wallet, ReceiptText, ArrowDownUp, PiggyBank, AlertTriangle, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { CurrencyPicker, usePreferredCurrency } from "@/components/ui/currency-picker";
import { getDashboardMonthData } from "@/lib/actions/dashboard-actions";
import { dashboardMonth } from "@/lib/dashboard-month";
import { toast } from "sonner";
import { formatMoney } from "@/lib/currency";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getNetWorthStatus } from "@/lib/finance/net-worth";
import { SkeletonChart, SkeletonPieChart } from "@/components/charts/skeleton-chart";

// Dynamic imports for better performance
const MonthlyChart = dynamic(() => import("@/components/dashboard/monthly-chart-dynamic").then(mod => ({ default: mod.MonthlyChartDynamic })), {
  ssr: false,
  loading: () => <SkeletonChart height="240px" />
});

const ExpenseBreakdown = dynamic(() => import("@/components/dashboard/expense-breakdown").then(mod => ({ default: mod.ExpenseBreakdown })), {
  ssr: false,
  loading: () => <SkeletonPieChart height="240px" />
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
      incomeChange: number | null;
      expensesChange: number | null;
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
  currency?: string;
  selectedPeriod?: string;
}

export function DashboardClient({ data: initialData, currency = "USD", selectedPeriod }: DashboardClientProps) {
  const [monthlyData, setMonthlyData] = useState({ financialsData: initialData.financialsData, expenseData: initialData.expenseData });
  const data = { ...initialData, ...monthlyData };
  const initialPeriod = dashboardMonth(selectedPeriod);
  const [period, setPeriod] = useState(initialPeriod);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const loadedPeriod = useRef(`${currency}:${initialPeriod}`);
  useEffect(() => {
    const target = `${currency}:${period}`;
    if (loadedPeriod.current === target) return;
    let active = true;
    setLoadingMonth(true);
    getDashboardMonthData(currency, period).then(result => {
      if (!active) return;
      if (!result.success) { changePeriod(loadedPeriod.current.split(":")[1]); toast.error(result.error); return; }
      setMonthlyData({ financialsData: result.financialsData, expenseData: result.expenseData });
      loadedPeriod.current = target;
    }).catch(() => { if (active) { changePeriod(loadedPeriod.current.split(":")[1]); toast.error("Could not load this month's dashboard. Please try again."); } })
      .finally(() => { if (active) setLoadingMonth(false); });
    return () => { active = false; };
  }, [currency, period]);
  function changePeriod(next: string) {
    setPeriod(next);
    const url = new URL(window.location.href);
    url.searchParams.set("month", next);
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  const [preferredCurrency] = usePreferredCurrency("dashboard");
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("currency") && preferredCurrency !== currency) {
      router.replace(`/?currency=${preferredCurrency}&month=${period}`);
    }
  }, [preferredCurrency, currency]);
  const router = useRouter();
  const formatCurrency = (amount: number) => formatMoney(amount, currency);
  const selectedMonth = Number(period.slice(5)) - 1;
  const selectedYear = Number(period.slice(0, 4));
  
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
      
      setMergedAccounts(allAccounts.filter((account: any) => (account.currency || "USD") === currency));
    };
    
    mergeAccountData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      mergeAccountData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [data.balanceData.accounts, currency]);
  
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
  const years = Array.from(new Set([currentYear + 1, ...Array.from({ length: 11 }, (_, i) => currentYear - i), selectedYear])).sort((a, b) => b - a);

  return (
    <>
      <div className="pp-dashboard-toolbar flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <CurrencyPicker compact remember preferenceKey="dashboard" value={currency} onChange={value => router.push(`/?currency=${value}&month=${period}`)} />
          <Select value={selectedMonth.toString()} onValueChange={(value) => changePeriod(`${selectedYear}-${String(Number(value) + 1).padStart(2, "0")}`)}>
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
          <Select value={selectedYear.toString()} onValueChange={(value) => changePeriod(`${value}-${String(selectedMonth + 1).padStart(2, "0")}`)}>
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
      
      <p role="status" className="mt-3 text-xs text-muted-foreground">{loadingMonth ? "Updating monthly figures…" : `${months[selectedMonth]} ${selectedYear} · Monthly activity`} · Balances show your current position</p>
      <div aria-busy={loadingMonth} className="mt-4 grid grid-cols-2 gap-3 md:mt-6 md:gap-4 lg:grid-cols-4">
        {/* Net Worth Card - Spans 2 columns */}
        <Card className="col-span-2 border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-background lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Net Worth</CardTitle>
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
                <div className="break-words text-3xl font-bold tracking-tight md:text-4xl">{formatCurrency(data.netWorthData.netWorth)}</div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <div>Assets: {formatCurrency(data.netWorthData.totalAssets)}</div>
                  <div>Liabilities: {formatCurrency(data.netWorthData.totalLiabilities)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="break-words text-xl font-bold md:text-2xl">Loading...</div>
                <p className="text-xs text-muted-foreground">Calculating net worth</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-xl font-bold md:text-2xl">{formatCurrency(totalBalance)}</div>
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
            <div className="break-words text-xl font-bold md:text-2xl">{formatCurrency(data.financialsData.current.income)}</div>
            <p className="text-xs text-muted-foreground">
              {data.financialsData.changes.incomeChange === null ? "No previous-month activity" : `${formatPercentChange(data.financialsData.changes.incomeChange)} from previous month`}
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
            <div className="break-words text-xl font-bold md:text-2xl">{formatCurrency(data.financialsData.current.expenses)}</div>
            <p className="text-xs text-muted-foreground">
              {data.financialsData.changes.expensesChange === null ? "No previous-month activity" : `${formatPercentChange(data.financialsData.changes.expensesChange)} from previous month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Net</CardTitle>
            <PiggyBank aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-xl font-bold md:text-2xl">{formatCurrency(data.financialsData.current.income - data.financialsData.current.expenses)}</div>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>
      </div>

      <NetWorthHistory currency={currency} month={period} />

      {data.netWorthData && (
        <details className="group mt-3 rounded-xl border bg-card text-card-foreground">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Assets and liabilities breakdown.</span>
            <span className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
              <span className="min-w-0 rounded-lg border border-teal-500/15 bg-teal-500/5 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400"><Wallet aria-hidden="true" className="h-4 w-4 shrink-0" />Assets</span>
                <span className="mt-1 block break-words text-sm font-semibold tabular-nums sm:text-base">{formatCurrency(data.netWorthData.totalAssets)}</span>
              </span>
              <span className="min-w-0 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400"><TrendingDown aria-hidden="true" className="h-4 w-4 shrink-0" />Liabilities</span>
                <span className="mt-1 block break-words text-sm font-semibold tabular-nums sm:text-base">{formatCurrency(data.netWorthData.totalLiabilities)}</span>
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-center gap-1 px-1 text-muted-foreground"><ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" /><span className="hidden text-xs sm:block">Details</span></span>
          </summary>
          <div className="grid gap-5 border-t px-4 py-4 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Wallet aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-400" />Assets</h2>
              <dl className="space-y-2 text-sm">
                {[['Accounts', data.netWorthData.accountAssets], ['Money owed to you', data.netWorthData.receivables], ['Total assets', data.netWorthData.totalAssets]].map(([label, amount]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-x-3 gap-y-1"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{formatCurrency(Number(amount))}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingDown aria-hidden="true" className="h-4 w-4 text-red-500" />Liabilities</h2>
              <dl className="space-y-2 text-sm">
                {[['Debts', data.netWorthData.debts], ['Account liabilities', data.netWorthData.accountLiabilities], ['Total liabilities', data.netWorthData.totalLiabilities]].map(([label, amount]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-x-3 gap-y-1"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{formatCurrency(Number(amount))}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </details>
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
              You have <strong>{data.financialsData.uncategorizedCount}</strong> uncategorized transaction{data.financialsData.uncategorizedCount !== 1 ? 's' : ''} in the selected month.
              <br />
              <a href={`/transactions?month=${period}`} className="text-yellow-800 underline hover:text-yellow-900">
                Categorize them now
              </a>{' '}
              to see accurate expense tracking.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="pp-dashboard-charts mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Card className="pp-chart-card min-w-0 gap-3 py-4">
          <CardHeader>
            <CardTitle className="text-base">Income vs expenses</CardTitle>
            <CardDescription>
              Six months ending {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyChart currency={currency} data={data.financialsData.monthlyData} />
          </CardContent>
        </Card>
        
        <Card className="pp-chart-card min-w-0 gap-3 py-4">
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
            <CardDescription>
              Spending in {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.expenseData.categories.length > 0 ? (
              <ExpenseBreakdown currency={currency} categories={data.expenseData.categories} />
            ) : (
              <div className="flex min-h-20 items-center justify-center text-sm">
                <p className="text-muted-foreground">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        <GoalsWidget currency={currency} goals={data.goalsData} />
      </div>

      <div className="mt-6">
        <RecentTransactions transactions={data.recentTransactions} />
      </div>
    </>
  );
}
