import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getAccountBalances, getMonthlyFinancials, getExpensesByCategory, getRecentTransactions } from "@/lib/actions/dashboard-actions";
import { getNetWorthSummary } from "@/lib/actions/net-worth-actions";
import { getGoals } from "@/lib/actions/goal-actions";

export default async function Home() {
  // Get dashboard data
  const { data: balanceData = { accounts: [], totalBalance: 0 } } = await getAccountBalances();
  const { data: financialsData = { monthlyData: [], current: { income: 0, expenses: 0, savings: 0, savingsRate: 0 }, changes: { incomeChange: 0, expensesChange: 0, savingsRateChange: 0 }, uncategorizedCount: 0 } } = await getMonthlyFinancials();
  const { data: expenseData = { categories: [], totalExpenses: 0 } } = await getExpensesByCategory();
  const { data: recentTransactions = [] } = await getRecentTransactions();
  const { data: netWorthData } = await getNetWorthSummary();
  const { data: goalsData = [] } = await getGoals();
  
  return (
    <DashboardLayout>
      <DashboardClient 
        data={{
          balanceData,
          financialsData,
          expenseData,
          recentTransactions,
          netWorthData: netWorthData as any,
          goalsData
        }}
      />
    </DashboardLayout>
  );
}
