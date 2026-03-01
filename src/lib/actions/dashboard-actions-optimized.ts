"use server";

import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getMonthlyFinancialData, getUncategorizedCount } from "@/lib/finance/calculations";
import { getNetWorthSummary } from "./net-worth-actions";
import { getGoals } from "./goal-actions";

// Helper function to get the default user (dev@pocketpilot.local)
async function getDefaultUser() {
  const user = await prisma.user.findUnique({
    where: {
      email: "dev@pocketpilot.local",
    },
  });

  if (!user) {
    throw new Error("Default user not found. Please run the seed script.");
  }

  return user;
}

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
      prisma.$queryRaw<Array<{
        categoryId: string;
        categoryName: string;
        categoryGroup: string;
        amount: bigint;
      }>>`
        SELECT 
          t."categoryId",
          c.name as "categoryName",
          c.group as "categoryGroup",
          COALESCE(SUM(t.amount), 0) as amount
        FROM "Transaction" t
        LEFT JOIN "Category" c ON t."categoryId" = c.id
        WHERE t."userId" = ${userId}
          AND t.type = 'EXPENSE'
          AND t.date >= ${startOfMonth(new Date())}
          AND t.date <= ${endOfMonth(new Date())}
          AND t."categoryId" IS NOT NULL
        GROUP BY t."categoryId", c.name, c.group
        ORDER BY amount DESC
      `,
      
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
      prisma.$queryRaw<Array<{
        month: Date;
        income: bigint;
        expenses: bigint;
      }>>`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expenses
        FROM "Transaction" 
        WHERE "userId" = ${userId}
          AND date >= ${subMonths(dateRange.from, 11)}
          AND date <= ${dateRange.to}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month ASC
      `,
      
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
      prisma.$queryRaw<Array<{
        date: Date;
        amount: bigint;
      }>>`
        SELECT 
          DATE(date) as date,
          SUM(amount) as amount
        FROM "Transaction" 
        WHERE "userId" = ${userId}
          AND type = 'EXPENSE'
          AND date >= ${dateRange.from}
          AND date <= ${dateRange.to}
        GROUP BY DATE(date)
        ORDER BY date ASC
      `,
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
