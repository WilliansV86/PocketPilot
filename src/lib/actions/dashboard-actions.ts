"use server";
import { transactionDisplay } from "@/lib/transaction-display";

import { prisma } from "@/lib/db";
import { dashboardMonth, dashboardMonthRange, dashboardChartMonths } from "@/lib/dashboard-month";
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
export async function getAccountBalances(currency = "USD") {
  try {
    // Get the default user
    const user = await getDefaultUser();
    
    const accounts = await prisma.financialAccount.findMany({
      where: {
        userId: user.id,
        currency,
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
export async function getMonthlyFinancials(currency = "USD", selectedMonth?: string) {
  try {
    const chosen = dashboardMonth(selectedMonth);
    const monthlyData = [];
    for (const date of dashboardChartMonths(chosen)) {
      const month = date.getUTCMonth() + 1;
      const year = date.getUTCFullYear();
      const monthName = date.toLocaleString('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' });

      // Use shared calculation logic
      const financialData = await getMonthlyFinancialData(month, year, currency);
      
      monthlyData.push({
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
    const incomeChange = previousMonthData?.income > 0 ?
      ((currentMonthData.income - previousMonthData.income) / previousMonthData.income) * 100 : null;
    
    const expensesChange = previousMonthData?.expenses > 0 ?
      ((currentMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100 : null;
    
    const savingsRate = currentMonthData.income > 0 ? 
      (currentMonthData.savings / currentMonthData.income) * 100 : 0;
    
    const savingsRateChange = previousMonthData && previousMonthData.income > 0 ?
      savingsRate - ((previousMonthData.savings / previousMonthData.income) * 100) : 0;
    
    // Get uncategorized transactions count for current month
    const [currentYear, currentMonth] = chosen.split("-").map(Number);
    const uncategorizedCount = await getUncategorizedCount(currentMonth, currentYear, currency);
    
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
export async function getExpensesByCategory(currency = "USD", selectedMonth?: string) {
  try {
    const user = await getDefaultUser();
    const { start: monthStart, end: monthEnd } = dashboardMonthRange(selectedMonth);
    
    // Get transactions with categories
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        date: {
          gte: monthStart,
          lt: monthEnd,
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
export async function getRecentTransactions(currency = "USD") {
  try {
    const user = await getDefaultUser();
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
      },
      take: 5,
      orderBy: {
        date: "desc",
      },
      include: {
        account: true,
        creditCard: { select: { id: true, name: true, currency: true } },
        category: true,
      },
    });
    
    // Convert Decimal amounts to numbers and account balances to numbers for frontend compatibility
    const formattedTransactions = transactions.map(transactionDisplay);
    
    return { success: true, data: formattedTransactions };
  } catch (error) {
    console.error("Failed to fetch recent transactions:", error);
    return { success: false, error: "Failed to load recent transactions" };
  }
}

export async function getDashboardMonthData(currency = "USD", selectedMonth?: string) {
  const month = dashboardMonth(selectedMonth);
  const [financials, expenses] = await Promise.all([
    getMonthlyFinancials(currency === "CAD" ? "CAD" : "USD", month),
    getExpensesByCategory(currency === "CAD" ? "CAD" : "USD", month),
  ]);
  if (!financials.success || !expenses.success || !financials.data || !expenses.data) {
    return { success: false as const, error: "Could not load this month's dashboard. Please try again." };
  }
  return { success: true as const, financialsData: financials.data, expenseData: expenses.data };
}
