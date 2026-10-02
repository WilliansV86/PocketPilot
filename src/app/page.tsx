import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getAccountBalances, getMonthlyFinancials, getExpensesByCategory, getRecentTransactions } from "@/lib/actions/dashboard-actions";
import { getNetWorthSummary } from "@/lib/actions/net-worth-actions";
import { getGoals } from "@/lib/actions/goal-actions";

export default async function Home({ searchParams }: { searchParams: Promise<{ currency?: string }> }) {
  const params = await searchParams;
  const currency = params.currency === "CAD" ? "CAD" : "USD";
  // Get dashboard data
  const { data: balanceData = { accounts: [], totalBalance: 0 } } = await getAccountBalances(currency);
  const { data: financialsData = { monthlyData: [], current: { income: 0, expenses: 0, savings: 0, savingsRate: 0 }, changes: { incomeChange: 0, expensesChange: 0, savingsRateChange: 0 }, uncategorizedCount: 0 } } = await getMonthlyFinancials(currency);
  const { data: expenseData = { categories: [], totalExpenses: 0 } } = await getExpensesByCategory(currency);
  const { data: recentTransactions = [] } = await getRecentTransactions(currency);
  const { data: netWorthData } = await getNetWorthSummary(currency);
  const { data: goalsData = [] } = await getGoals();
  
  return (
    <DashboardLayout>
      <DashboardClient 
        currency={currency}
        key={currency}
        data={{
          balanceData,
          financialsData,
          expenseData,
          recentTransactions,
          netWorthData: netWorthData as any,
          goalsData: goalsData.filter((item: any) => (item.goal.currency || "USD") === currency)
        }}
      />
    </DashboardLayout>
  );
}
