"use server";

import { getDefaultUser } from "@/lib/get-default-user";

import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getMonthlyFinancialData, getUncategorizedCount } from "@/lib/finance/calculations";
import { getNetWorthSummary } from "./net-worth-actions";
import { getGoals } from "./goal-actions";

// All dashboard queries use the authenticated owner.


// Consolidated dashboard data fetch - reduces multiple round trips
export async function getDashboardData() {
  try {
    // Get the default user once
    const user = await getDefaultUser();
    const userId = user.id;

    // Execute all queries in parallel for better performance
    const [
      accounts,
      monthlyFinancials,
      expenseCategories,
      recentTransactions,
      netWorthData,
      goalsData
    ] = await Promise.all([
      // Account balances
      prisma.financialAccount.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
        },
        orderBy: { balance: "desc" },
      }),
      
      // Monthly financial data
      getMonthlyFinancialData(new Date().getMonth() + 1, new Date().getFullYear()),
      
      // Expense by category (raw query)
      (async () => {
        const rows = await prisma.transaction.findMany({
          where: { userId, type: "EXPENSE", date: { gte: startOfMonth(new Date()), lte: endOfMonth(new Date()) }, categoryId: { not: null } },
          include: { category: true },
        });
        const groups = new Map<string, { categoryId: string; categoryName: string; categoryGroup: string; amount: number }>();
        for (const row of rows) {
          if (!row.category || !row.categoryId) continue;
          const item = groups.get(row.categoryId) ?? { categoryId: row.categoryId, categoryName: row.category.name, categoryGroup: row.category.group, amount: 0 };
          item.amount += Number(row.amount); groups.set(row.categoryId, item);
        }
        return [...groups.values()].sort((a,b) => b.amount-a.amount);
      })(),
      
      // Recent transactions
      prisma.transaction.findMany({
        where: { userId },
        take: 10,
        orderBy: { date: "desc" },
        include: {
          account: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      
      // Net worth summary
      getNetWorthSummary(),
      
      // Goals data
      getGoals(),
    ]);

    // Process expense data
    const expenseData = expenseCategories.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryGroup: cat.categoryGroup,
      amount: Number(cat.amount),
    }));

    // Format and process data
    const formattedAccounts = accounts.map(account => ({
      ...account,
      balance: Number(account.balance),
    }));

    const formattedTransactions = recentTransactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      date: transaction.date,
    }));

    const totalExpenses = expenseData.reduce((sum, cat) => sum + cat.amount, 0);

    return {
      success: true,
      data: {
        balanceData: {
          accounts: formattedAccounts,
          totalBalance: formattedAccounts.reduce((sum, acc) => sum + acc.balance, 0),
        },
        financialsData: monthlyFinancials,
        expenseData: {
          categories: expenseData,
          totalExpenses,
        },
        recentTransactions: formattedTransactions,
        netWorthData,
        goalsData,
      },
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard data",
    };
  }
}

// Optimized stats data fetch
export async function getStatsData(dateRange: { from: Date; to: Date }) {
  try {
    const user = await getDefaultUser();
    const userId = user.id;

    const [
      monthlyCashflow,
      categorySpending,
      accountBreakdown,
      dailySpend
    ] = await Promise.all([
      // Monthly cashflow for the last 12 months
      (async () => {
        const rows = await prisma.transaction.findMany({ where: { userId, date: { gte: subMonths(dateRange.from, 11), lte: dateRange.to } }, select: { date: true, type: true, amount: true } });
        const groups = new Map<string, { month: Date; income: number; expenses: number }>();
        for (const row of rows) {
          const key = row.date.toISOString().slice(0,7);
          const item = groups.get(key) ?? { month: new Date(key + "-01T00:00:00Z"), income: 0, expenses: 0 };
          if (row.type === "INCOME") item.income += Number(row.amount);
          if (row.type === "EXPENSE") item.expenses += Number(row.amount);
          groups.set(key, item);
        }
        return [...groups.values()].sort((a,b) => a.month.getTime()-b.month.getTime());
      })(),
      
      // Category spending
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _sum: { amount: true },
      }),
      
      // Account breakdown
      prisma.financialAccount.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          balance: true,
          type: true,
        },
      }),
      
      // Daily spending
      (async () => {
        const rows = await prisma.transaction.findMany({ where: { userId, type: "EXPENSE", date: { gte: dateRange.from, lte: dateRange.to } }, select: { date: true, amount: true } });
        const groups = new Map<string, { date: Date; amount: number }>();
        for (const row of rows) {
          const key = row.date.toISOString().slice(0,10);
          const item = groups.get(key) ?? { date: new Date(key + "T00:00:00Z"), amount: 0 };
          item.amount += Number(row.amount); groups.set(key, item);
        }
        return [...groups.values()].sort((a,b) => a.date.getTime()-b.date.getTime());
      })(),
    ]);

    return {
      success: true,
      data: {
        monthlyCashflow: monthlyCashflow.map(item => ({
          month: item.month,
          income: Number(item.income),
          expenses: Number(item.expenses),
        })),
        categorySpending: categorySpending.map(cat => ({
          categoryId: cat.categoryId,
          amount: Number(cat._sum.amount),
        })),
        accountBreakdown: accountBreakdown.map(acc => ({
          ...acc,
          balance: Number(acc.balance),
        })),
        dailySpend: dailySpend.map(item => ({
          date: item.date,
          amount: Number(item.amount),
        })),
      },
    };
  } catch (error) {
    console.error("Stats data fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch stats data",
    };
  }
}
