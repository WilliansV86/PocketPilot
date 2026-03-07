import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { getDefaultUser } from "@/lib/get-default-user";

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export function getDateRangePreset(preset: string): DateRange {
  const now = new Date();
  
  switch (preset) {
    case "this_month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: "This Month"
      };
    case "last_month":
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: "Last Month"
      };
    case "last_3_months":
      return {
        start: startOfMonth(subMonths(now, 2)),
        end: endOfMonth(now),
        label: "Last 3 Months"
      };
    case "last_6_months":
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now),
        label: "Last 6 Months"
      };
    case "ytd":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: "Year to Date"
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: "This Month"
      };
  }
}

export async function getMonthlyCashflow(range: DateRange) {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
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

    // Group by month and type
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      const amount = Number(transaction.amount);
      
      if (transaction.type === "INCOME") {
        monthlyData[monthKey].income += amount;
      } else if (transaction.type === "EXPENSE") {
        monthlyData[monthKey].expenses += amount;
      }
    });

    // Convert to array and sort by month
    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting monthly cashflow:", error);
    return { success: false, error: "Failed to get monthly cashflow" };
  }
}

export async function getCategorySpending(range: DateRange) {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: range.start,
          lte: range.end,
        },
        categoryId: {
          not: null,
        },
      },
      include: {
        category: true,
      },
    });

    // Group by category
    const categorySpending: { [key: string]: { name: string; amount: number; color: string } } = {};

    transactions.forEach(transaction => {
      const categoryName = transaction.category?.name || "Uncategorized";
      const categoryColor = transaction.category?.color || "#6b7280";
      
      if (!categorySpending[categoryName]) {
        categorySpending[categoryName] = { name: categoryName, amount: 0, color: categoryColor };
      }
      
      categorySpending[categoryName].amount += Number(transaction.amount);
    });

    // Convert to array and sort by amount (descending)
    let result = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);

    // Group categories < 3% into "Other"
    const total = result.reduce((sum, cat) => sum + cat.amount, 0);
    const threshold = total * 0.03; // 3%

    const significantCategories = result.filter(cat => cat.amount >= threshold);
    const otherCategories = result.filter(cat => cat.amount < threshold);

    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
      significantCategories.push({
        name: "Other",
        amount: otherTotal,
        color: "#9ca3af"
      });
    }

    return { success: true, data: significantCategories };
  } catch (error) {
    console.error("Error getting category spending:", error);
    return { success: false, error: "Failed to get category spending" };
  }
}

export async function getAccountBreakdown() {
  try {
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

export async function getDailySpend(month: DateRange) {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
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

    // Group by day
    const dailySpending: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      const dayKey = transaction.date.toISOString().slice(0, 10); // YYYY-MM-DD
      dailySpending[dayKey] = (dailySpending[dayKey] || 0) + Number(transaction.amount);
    });

    // Convert to array and sort by date
    const result = Object.entries(dailySpending)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting daily spend:", error);
    return { success: false, error: "Failed to get daily spend" };
  }
}

export async function getTopSpending(range: DateRange) {
  try {
    const user = await getDefaultUser();

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
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
