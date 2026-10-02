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
    const [balance, transactions, goals, categories] = await Promise.all([
      prisma.financialAccount.aggregate({ where: { userId }, _sum: { balance: true } }),
      prisma.transaction.count({ where: { userId, date: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      prisma.goal.count({ where: { userId, isCompleted: false } }),
      prisma.category.count({ where: { userId, isArchived: false } }),
    ]);
    return { success: true, data: {
      totalBalance: Number(balance._sum.balance ?? 0), recentTransactionsCount: transactions,
      activeGoalsCount: goals, activeCategoriesCount: categories,
    } };

  } catch (error) {
    console.error("Summary fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch summary",
    };
  }
}
