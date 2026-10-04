import "server-only";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";

import { monthlyCashflow, categorySpending, dailySpending } from "@/lib/stats-aggregation";
import type { DateRange } from "@/lib/stats-date-range";
export { getDateRangePreset, type DateRange } from "@/lib/stats-date-range";
export async function getMonthlyCashflow(range: DateRange, currency = "USD") {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        date: true,
        amount: true,
        type: true,
      },
    });

    const result = monthlyCashflow(transactions, range);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting monthly cashflow:", error);
    return { success: false, error: "Failed to get monthly cashflow" };
  }
}

export async function getCategorySpending(range: DateRange, currency = "USD") {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        type: "EXPENSE",
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      include: {
        category: true,
      },
    });

    return { success: true, data: categorySpending(transactions) };
  } catch (error) {
    console.error("Error getting category spending:", error);
    return { success: false, error: "Failed to get category spending" };
  }
}

export async function getAccountBreakdown(currency = "USD") {
  try {
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
      },
    });

    const result = accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      color: getAccountTypeColor(account.type),
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting account breakdown:", error);
    return { success: false, error: "Failed to get account breakdown" };
  }
}

export async function getDailySpend(month: DateRange, currency = "USD") {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        type: "EXPENSE",
        date: {
          gte: month.start,
          lte: month.end,
        },
      },
      select: {
        date: true,
        amount: true,
      },
    });

    const result = dailySpending(transactions, month);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting daily spend:", error);
    return { success: false, error: "Failed to get daily spend" };
  }
}

export async function getTopSpending(range: DateRange, currency = "USD") {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [{ account: { currency } }, { creditCard: { currency } }],
        type: "EXPENSE",
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
      take: 10,
    });

    const result = transactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.date,
      category: transaction.category,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting top spending:", error);
    return { success: false, error: "Failed to get top spending" };
  }
}

function getAccountTypeColor(type: string): string {
  const colors = {
    CHECKING: "#3b82f6",      // blue
    SAVINGS: "#10b981",      // green
    CREDIT_CARD: "#ef4444",   // red
    INVESTMENT: "#8b5cf6",   // purple
    LOAN: "#f59e0b",         // amber
    OTHER: "#6b7280",        // gray
  };
  return colors[type as keyof typeof colors] || "#6b7280";
}
