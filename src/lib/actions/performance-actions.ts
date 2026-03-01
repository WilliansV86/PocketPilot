"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

// Optimized revalidation - only revalidate what's needed
export async function revalidateSpecificPaths(paths: string[]) {
  paths.forEach(path => revalidatePath(path));
}

// Smart revalidation based on mutation type
export async function smartRevalidate(entityType: string, action: 'create' | 'update' | 'delete') {
  switch (entityType) {
    case 'transaction':
      // Revalidate dashboard, transactions, and stats
      revalidatePath('/');
      revalidatePath('/transactions');
      revalidatePath('/stats');
      break;
    case 'account':
      // Revalidate dashboard, accounts, and stats
      revalidatePath('/');
      revalidatePath('/accounts');
      revalidatePath('/stats');
      break;
    case 'goal':
      // Revalidate dashboard, goals only
      revalidatePath('/');
      revalidatePath('/goals');
      break;
    case 'category':
      // Revalidate transactions, categories, budgets
      revalidatePath('/transactions');
      revalidatePath('/categories');
      revalidatePath('/budgets');
      break;
    case 'budget':
      // Revalidate budgets and dashboard
      revalidatePath('/budgets');
      revalidatePath('/');
      break;
    default:
      // Fallback - revalidate all
      revalidatePath('/');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/goals');
      revalidatePath('/categories');
      revalidatePath('/budgets');
      revalidatePath('/stats');
  }
}

// Batch data fetching for better performance
export async function batchFetchData(userId: string) {
  try {
    // Fetch all essential data in parallel
    const [
      accounts,
      recentTransactions,
      goals,
      categories
    ] = await Promise.all([
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
      
      prisma.transaction.findMany({
        where: { userId },
        take: 10,
        orderBy: { date: "desc" },
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
          type: true,
          accountId: true,
          categoryId: true,
        },
      }),
      
      prisma.goal.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          targetDate: true,
        },
        orderBy: { targetDate: "asc" },
      }),
      
      prisma.category.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          group: true,
          color: true,
          isArchived: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        accounts: accounts.map(acc => ({ ...acc, balance: Number(acc.balance) })),
        transactions: recentTransactions.map(t => ({ ...t, amount: Number(t.amount) })),
        goals: goals.map(g => ({ 
          ...g, 
          targetAmount: Number(g.targetAmount), 
          currentAmount: Number(g.currentAmount) 
        })),
        categories,
      },
    };
  } catch (error) {
    console.error("Batch fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch data",
    };
  }
}

// Cache-friendly summary data
export async function getCachedSummaryData(userId: string) {
  // This would typically use Redis or another cache
  // For now, we'll implement a simple version
  try {
    const summary = await prisma.$queryRaw`
      SELECT 
        (SELECT COALESCE(SUM(balance), 0) FROM "FinancialAccount" WHERE "userId" = ${userId}) as total_balance,
        (SELECT COUNT(*) FROM "Transaction" WHERE "userId" = ${userId} AND date >= NOW() - INTERVAL '30 days') as recent_transactions_count,
        (SELECT COUNT(*) FROM "Goal" WHERE "userId" = ${userId} AND status != 'COMPLETED') as active_goals_count,
        (SELECT COUNT(*) FROM "Category" WHERE "userId" = ${userId} AND "isArchived" = false) as active_categories_count
    ` as {
      total_balance: bigint;
      recent_transactions_count: bigint;
      active_goals_count: bigint;
      active_categories_count: bigint;
    };

    return {
      success: true,
      data: {
        totalBalance: Number(summary.total_balance),
        recentTransactionsCount: Number(summary.recent_transactions_count),
        activeGoalsCount: Number(summary.active_goals_count),
        activeCategoriesCount: Number(summary.active_categories_count),
      },
    };
  } catch (error) {
    console.error("Summary fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch summary",
    };
  }
}
