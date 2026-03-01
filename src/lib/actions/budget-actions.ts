"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";
import { getTotalIncome, getTotalExpenses } from "@/lib/finance/calculations";

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

// Get budget data for a specific month
export async function getBudgetsForMonth(month: string, year: number) {
  try {
    const user = await getDefaultUser();
    
    // Get all categories except INCOME group
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        group: {
          not: "INCOME",
        },
        isArchived: false,
      },
      orderBy: [
        { group: "asc" },
        { name: "asc" },
      ],
    });

    // Get budgets for the specified month
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: `${year}-${month.padStart(2, '0')}`,
      },
      include: {
        category: true,
      },
    });

    // Get transactions for the month to calculate activity
    const monthStart = startOfMonth(new Date(year, parseInt(month) - 1));
    const monthEnd = endOfMonth(new Date(year, parseInt(month) - 1));
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        type: "EXPENSE",
      },
      include: {
        category: true,
      },
    });

    // Calculate activity per category and uncategorized transactions
    const activityMap = new Map();
    let uncategorizedCount = 0;
    let uncategorizedTotal = 0;

    transactions.forEach((transaction) => {
      const amount = Math.abs(Number(transaction.amount));
      if (transaction.categoryId) {
        activityMap.set(transaction.categoryId, (activityMap.get(transaction.categoryId) || 0) + amount);
      } else {
        uncategorizedCount++;
        uncategorizedTotal += amount;
      }
    });

    // Get budget moves for the month
    const budgetMoves = await (prisma as any).budgetMove.findMany({
      where: {
        userId: user.id,
        month: `${year}-${month.padStart(2, '0')}`,
      },
    });

    // Calculate moves in/out per category
    const movesInMap = new Map();
    const movesOutMap = new Map();

    budgetMoves.forEach((move: any) => {
      const amount = Number(move.amount);
      movesInMap.set(move.toCategoryId, (movesInMap.get(move.toCategoryId) || 0) + amount);
      movesOutMap.set(move.fromCategoryId, (movesOutMap.get(move.fromCategoryId) || 0) + amount);
    });

    // Combine categories with budgets and activity
    const budgetData = categories.map((category) => {
      const budget = budgets.find((b) => b.categoryId === category.id);
      const activity = activityMap.get(category.id) || 0;
      const budgeted = budget ? Number(budget.amount) : 0;
      const movesIn = movesInMap.get(category.id) || 0;
      const movesOut = movesOutMap.get(category.id) || 0;
      const available = budgeted - activity + movesIn - movesOut;

      return {
        id: category.id,
        name: category.name,
        group: category.group,
        color: category.color,
        icon: category.icon,
        budgeted,
        activity,
        available,
        movesIn,
        movesOut,
        budgetId: budget?.id || null,
      };
    });

    // Calculate totals
    const totalBudgeted = budgetData.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActivity = budgetData.reduce((sum, item) => sum + item.activity, 0);
    const totalAvailable = budgetData.reduce((sum, item) => sum + item.available, 0);

    // Use shared calculation logic for consistency
    const [monthlyIncome, monthlyExpenses] = await Promise.all([
      getTotalIncome(parseInt(month), year),
      getTotalExpenses(parseInt(month), year),
    ]);

    return {
      success: true,
      data: {
        categories: budgetData,
        uncategorized: {
          count: uncategorizedCount,
          total: uncategorizedTotal,
        },
        totals: {
          income: monthlyIncome,
          expenses: monthlyExpenses,
          budgeted: totalBudgeted,
          available: totalAvailable,
          leftToBudget: monthlyIncome - totalBudgeted,
        },
      },
    };
  } catch (error) {
    console.error("Failed to fetch budget data:", error);
    return { success: false, error: "Failed to load budget data" };
  }
}

// Update or create budget for a category
export async function updateBudget(categoryId: string, month: string, year: number, amount: number) {
  try {
    const user = await getDefaultUser();
    const monthString = `${year}-${month.padStart(2, '0')}`;

    // Upsert the budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: user.id,
          categoryId,
          month: monthString,
        },
      },
      update: {
        amount: amount,
        year: year,
      },
      create: {
        userId: user.id,
        categoryId,
        month: monthString,
        year: year,
        amount: amount,
      },
    });

    revalidatePath("/budgets");
    return { 
      success: true, 
      data: {
        ...budget,
        amount: Number(budget.amount),
      }, 
      message: "Budget updated successfully" 
    };
  } catch (error) {
    console.error("Failed to update budget:", error);
    return { success: false, error: "Failed to update budget" };
  }
}

// Move money between categories
export async function moveBudgetMoney(
  fromCategoryId: string,
  toCategoryId: string,
  month: string,
  year: number,
  amount: number
) {
  try {
    const user = await getDefaultUser();
    const monthString = `${year}-${month.padStart(2, '0')}`;

    // Get source budget
    const fromBudget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month: {
          userId: user.id,
          categoryId: fromCategoryId,
          month: monthString,
        },
      },
    });

    if (!fromBudget || Number(fromBudget.amount) < amount) {
      return { success: false, error: "Insufficient funds in source category" };
    }

    // Perform the transfer in a transaction
    await prisma.$transaction(async (tx) => {
      // Record the budget move
      await (tx as any).budgetMove.create({
        data: {
          amount: amount,
          month: monthString,
          year: year,
          fromCategoryId: fromCategoryId,
          toCategoryId: toCategoryId,
          userId: user.id,
        },
      });

      // Note: We don't change the budget amounts anymore
      // The available calculation now includes moves in/out
    });

    revalidatePath("/budgets");
    return { success: true, message: "Money moved successfully" };
  } catch (error) {
    console.error("Failed to move budget money:", error);
    return { success: false, error: "Failed to move money" };
  }
}

// Delete budget for a category
export async function deleteBudget(categoryId: string, month: string, year: number) {
  try {
    const user = await getDefaultUser();
    const monthString = `${year}-${month.padStart(2, '0')}`;

    await prisma.budget.delete({
      where: {
        userId_categoryId_month: {
          userId: user.id,
          categoryId,
          month: monthString,
        },
      },
    });

    revalidatePath("/budgets");
    return { success: true, message: "Budget deleted successfully" };
  } catch (error) {
    console.error("Failed to delete budget:", error);
    return { success: false, error: "Failed to delete budget" };
  }
}
