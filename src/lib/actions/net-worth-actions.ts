"use server";

import { prisma } from "@/lib/db";
import { getNetWorthBreakdown } from "@/lib/finance/net-worth";

// Default user email for single-user mode
const DEFAULT_USER_EMAIL = "dev@pocketpilot.local";

// Helper function to get the default user
async function getDefaultUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: DEFAULT_USER_EMAIL },
    });

    if (!user) {
      throw new Error("Default user not found");
    }

    return user;
  } catch (error) {
    console.error("Error getting default user:", error);
    throw new Error("Failed to get default user");
  }
}

/**
 * Fetches all data needed for net worth calculation for a user
 * Returns complete net worth breakdown using the shared calculation engine
 */
export async function getNetWorth() {
  try {
    const user = await getDefaultUser();

    // Fetch accounts with only needed fields
    const accounts = await prisma.financialAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
      },
    });

    // Fetch debts with only needed fields
    const debts = await prisma.debt?.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        currentBalance: true,
        isClosed: true,
      },
    }) || [];

    // Fetch money owed records if the model exists
    let moneyOwed: any[] = [];
    if (prisma.moneyOwed) {
      moneyOwed = await prisma.moneyOwed.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          personName: true,
          amountOutstanding: true,
          status: true,
          isArchived: true,
        },
      });
    }

    // Calculate net worth breakdown using the shared engine
    const netWorthData = getNetWorthBreakdown({
      accounts: accounts.map(account => ({
        ...account,
        balance: Number(account.balance),
      })),
      debts: debts.map(debt => ({
        ...debt,
        currentBalance: Number(debt.currentBalance),
      })),
      moneyOwed: moneyOwed.map(item => ({
        ...item,
        amountOutstanding: Number(item.amountOutstanding),
      })),
    });

    return {
      success: true,
      data: netWorthData,
    };
  } catch (error) {
    console.error("Error calculating net worth:", error);
    return {
      success: false,
      error: "Failed to calculate net worth",
    };
  }
}

/**
 * Fetches simplified net worth data for dashboard cards
 * Returns only the essential values needed for display
 */
export async function getNetWorthSummary() {
  try {
    const result = await getNetWorth();
    
    if (!result.success) {
      return result;
    }

    const { data } = result;
    
    if (!data) {
      return {
        success: false,
        error: "No net worth data available",
      };
    }

    return {
      success: true,
      data: {
        netWorth: data.netWorth,
        totalAssets: data.assets.total,
        totalLiabilities: data.liabilities.total,
        accountAssets: data.assets.accountAssets,
        receivables: data.assets.receivables,
        debts: data.liabilities.debts,
        accountLiabilities: data.liabilities.accountLiabilities,
      },
    };
  } catch (error) {
    console.error("Error getting net worth summary:", error);
    return {
      success: false,
      error: "Failed to get net worth summary",
    };
  }
}

/**
 * Revalidates all pages that display net worth information
 * Call this after any mutation that affects net worth
 */
export async function revalidateNetWorthPages() {
  const { revalidatePath } = require("next/cache");
  
  // Revalidate all pages that display net worth
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/debts");
  revalidatePath("/money-owed");
  revalidatePath("/transactions");
}
