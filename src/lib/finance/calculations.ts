import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

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

/**
 * Get total income for a specific month and year
 * Only includes transactions with type INCOME
 */
export async function getTotalIncome(month: number, year: number, currency = "USD"): Promise<number> {
  try {
    const user = await getDefaultUser();
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const result = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        type: "INCOME",
      },
      _sum: {
        amount: true,
      },
    });

    return Math.abs(Number(result._sum?.amount || 0));
  } catch (error) {
    console.error("Failed to calculate total income:", error);
    return 0;
  }
}

/**
 * Get total expenses for a specific month and year
 * Only includes transactions with type EXPENSE and categoryId IS NOT NULL
 */
export async function getTotalExpenses(month: number, year: number, currency = "USD"): Promise<number> {
  try {
    const user = await getDefaultUser();
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const result = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        type: "EXPENSE",
        categoryId: {
          not: null,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Math.abs(Number(result._sum?.amount || 0));
  } catch (error) {
    console.error("Failed to calculate total expenses:", error);
    return 0;
  }
}

/**
 * Get cash flow (income - expenses) for a specific month and year
 */
export async function getCashFlow(month: number, year: number, currency = "USD"): Promise<number> {
  const income = await getTotalIncome(month, year, currency);
  const expenses = await getTotalExpenses(month, year, currency);
  return income - expenses;
}

/**
 * Get count of uncategorized transactions for a specific month and year
 * Uncategorized = income or expense transactions with categoryId IS NULL
 */
export async function getUncategorizedCount(month: number, year: number, currency = "USD"): Promise<number> {
  try {
    const user = await getDefaultUser();
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const count = await prisma.transaction.count({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        type: { in: ["INCOME", "EXPENSE"] },
        categoryId: null,
      },
    });

    return count;
  } catch (error) {
    console.error("Failed to count uncategorized transactions:", error);
    return 0;
  }
}

/**
 * Get detailed financial data for a month (income, expenses, cash flow, uncategorized)
 */
export async function getMonthlyFinancialData(month: number, year: number, currency = "USD") {
  const [income, expenses, cashFlow, uncategorizedCount] = await Promise.all([
    getTotalIncome(month, year, currency),
    getTotalExpenses(month, year, currency),
    getCashFlow(month, year, currency),
    getUncategorizedCount(month, year, currency),
  ]);

  return {
    income,
    expenses,
    cashFlow,
    uncategorizedCount,
    savings: cashFlow,
  };
}
