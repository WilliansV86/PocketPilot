"use server";

import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getMonthlyFinancialData, getUncategorizedCount } from "@/lib/finance/calculations";
import { getNetWorthSummary } from "./net-worth-actions";

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

// Function to get account balances
export async function getAccountBalances() {
  try {
    // Get the default user
    const user = await getDefaultUser();
    
    const accounts = await prisma.financialAccount.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
      },
      orderBy: {
        balance: "desc",
      },
    });
    
    // Convert Decimal balances to numbers for frontend compatibility
    const formattedAccounts = accounts.map(account => ({
      ...account,
      balance: Number(account.balance),
    }));
    
    // Calculate total balance
    const totalBalance = formattedAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    return { 
      success: true, 
      data: {
        accounts: formattedAccounts,
        totalBalance,
      }
    };
  } catch (error) {
    console.error("Failed to fetch account balances:", error);
    return { success: false, error: "Failed to load account balances" };
  }
}

// Function to get monthly income vs expenses using shared calculation logic
export async function getMonthlyFinancials() {
  try {
    const now = new Date();
    const months = 6; // Get data for the last 6 months
    
    const monthlyData = [];
    
    // Loop through last N months
    for (let i = 0; i < months; i++) {
      const date = subMonths(now, i);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const year = date.getFullYear();
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      // Use shared calculation logic
      const financialData = await getMonthlyFinancialData(month, year);
      
      monthlyData.unshift({
        month: monthName,
        income: financialData.income,
        expenses: financialData.expenses,
        savings: financialData.savings,
      });
    }
    
    // Calculate this month's income, expenses, and savings
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const previousMonthData = monthlyData[monthlyData.length - 2];
    
    // Calculate percentage changes
    const incomeChange = previousMonthData ? 
      ((currentMonthData.income - previousMonthData.income) / previousMonthData.income) * 100 : 0;
    
    const expensesChange = previousMonthData ? 
      ((currentMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100 : 0;
    
    const savingsRate = currentMonthData.income > 0 ? 
      (currentMonthData.savings / currentMonthData.income) * 100 : 0;
    
    const savingsRateChange = previousMonthData && previousMonthData.income > 0 ?
      savingsRate - ((previousMonthData.savings / previousMonthData.income) * 100) : 0;
    
    // Get uncategorized transactions count for current month
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const uncategorizedCount = await getUncategorizedCount(currentMonth, currentYear);
    
    return { 
      success: true, 
      data: {
        monthlyData,
        current: {
          income: currentMonthData.income,
          expenses: currentMonthData.expenses,
          savings: currentMonthData.savings,
          savingsRate,
        },
        changes: {
          incomeChange,
          expensesChange,
          savingsRateChange,
        },
        uncategorizedCount,
      }
    };
  } catch (error) {
    console.error("Failed to fetch monthly financials:", error);
    return { success: false, error: "Failed to load monthly financial data" };
  }
}

// Function to get expense breakdown by category
export async function getExpensesByCategory() {
  try {
    const user = await getDefaultUser();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Get transactions with categories
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        amount: {
          lt: 0,
        },
        type: "EXPENSE",
        categoryId: {
          not: null,
        },
      },
      include: {
        category: true,
      },
    });
    
    // Group by category
    const categoryMap = new Map();
    let totalExpenses = 0;
    
    transactions.forEach((transaction) => {
      // Skip if no category
      if (!transaction.category || !transaction.categoryId) return;
      
      const categoryId = transaction.categoryId;
      const amount = Math.abs(Number(transaction.amount));
      totalExpenses += amount;
      
      if (categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          ...categoryMap.get(categoryId),
          amount: categoryMap.get(categoryId).amount + amount,
        });
      } else {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: transaction.category.name,
          color: transaction.category.color,
          icon: transaction.category.icon,
          amount,
        });
      }
    });
    
    // Convert to array and calculate percentages
    const categories = Array.from(categoryMap.values()).map((category) => ({
      ...category,
      percentage: (category.amount / totalExpenses) * 100,
    }));
    
    // Sort by amount descending
    categories.sort((a, b) => b.amount - a.amount);
    
    return { 
      success: true, 
      data: {
        categories,
        totalExpenses,
      }
    };
  } catch (error) {
    console.error("Failed to fetch expenses by category:", error);
    return { success: false, error: "Failed to load expense breakdown" };
  }
}

// Function to get recent transactions
export async function getRecentTransactions() {
  try {
    const user = await getDefaultUser();
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      take: 5,
      orderBy: {
        date: "desc",
      },
      include: {
        account: true,
        category: true,
      },
    });
    
    // Convert Decimal amounts to numbers and account balances to numbers for frontend compatibility
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      account: {
        ...transaction.account,
        balance: Number(transaction.account.balance),
      },
    }));
    
    return { success: true, data: formattedTransactions };
  } catch (error) {
    console.error("Failed to fetch recent transactions:", error);
    return { success: false, error: "Failed to load recent transactions" };
  }
}
