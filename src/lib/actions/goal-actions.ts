"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { calculateGoalProgress, validateGoalData } from "@/lib/finance/goals";

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

// Define the validation schema for goal creation
const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  type: z.enum(["SAVINGS", "DEBT_PAYOFF", "PURCHASE", "EMERGENCY_FUND", "INVESTMENT", "OTHER"]),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  targetDate: z.string().optional(),
  linkedAccountId: z.string().nullable().optional(),
  linkedDebtId: z.string().nullable().optional(),
  autoTrack: z.coerce.boolean().default(true),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().nullable().optional(),
});

// Define the validation schema for goal contribution
const contributionSchema = z.object({
  amount: z.coerce.number().positive("Contribution amount must be positive"),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
  accountId: z.string().optional(),
});

/**
 * Get all goals for the user with progress calculations
 */
export async function getGoals() {
  try {
    const user = await getDefaultUser();

    // Check if Goal model exists by trying to access it
    if (!prisma.goal) {
      return { 
        success: true, 
        data: [],
        message: "Goals module not available - database migration needed" 
      };
    }

    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      include: {
        linkedAccount: true,
        linkedDebt: true,
        contributions: {
          orderBy: { date: 'desc' },
          take: 5, // Only get recent contributions for list view
        },
      },
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const linkedData = {
        account: goal.linkedAccount,
        debt: goal.linkedDebt,
      };
      const progress = calculateGoalProgress(goal, linkedData);
      
      // Convert the goal object to plain JSON-safe object
      return {
        ...progress,
        goal: {
          ...goal,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
          linkedAccount: goal.linkedAccount ? {
            ...goal.linkedAccount,
            balance: Number(goal.linkedAccount.balance)
          } : null,
          linkedDebt: goal.linkedDebt ? {
            ...goal.linkedDebt,
            currentBalance: Number(goal.linkedDebt.currentBalance),
            originalAmount: Number(goal.linkedDebt.originalAmount)
          } : null,
          contributions: goal.contributions?.map(c => ({
            ...c,
            amount: Number(c.amount)
          })) || []
        }
      };
    });

    return { success: true, data: goalsWithProgress };
  } catch (error) {
    console.error("Error fetching goals:", error);
    // If the error is about missing table, return empty array with success
    if (error instanceof Error && error.message.includes('table')) {
      return { 
        success: true, 
        data: [],
        message: "Goals module not available - database migration needed" 
      };
    }
    return { success: false, error: "Failed to load goals" };
  }
}

/**
 * Get a single goal by ID with full details
 */
export async function getGoal(id: string) {
  try {
    const user = await getDefaultUser();

    if (!prisma.goal) {
      return { success: false, error: "Goals module not available" };
    }

    const goal = await prisma.goal.findFirst({
      where: { 
        id, 
        userId: user.id 
      },
      include: {
        linkedAccount: true,
        linkedDebt: true,
        contributions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!goal) {
      return { success: false, error: "Goal not found" };
    }

    const linkedData = {
      account: goal.linkedAccount,
      debt: goal.linkedDebt,
    };
    const progress = calculateGoalProgress(goal, linkedData);

    return { success: true, data: { ...goal, progress } };
  } catch (error) {
    console.error("Error fetching goal:", error);
    return { success: false, error: "Failed to load goal" };
  }
}

/**
 * Create a new goal
 */
export async function createGoal(formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = goalSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      targetAmount: formData.get("targetAmount"),
      startDate: formData.get("startDate"),
      targetDate: formData.get("targetDate"),
      linkedAccountId: formData.get("linkedAccountId"),
      linkedDebtId: formData.get("linkedDebtId"),
      autoTrack: formData.get("autoTrack"),
      priority: formData.get("priority"),
      notes: formData.get("notes"),
    });

    // Additional validation
    const validation = validateGoalData({
      ...parsed,
      startDate: new Date(parsed.startDate),
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : undefined,
    });

    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(", ") };
    }

    // Get the default user
    const user = await getDefaultUser();

    if (!prisma.goal) {
      return { success: false, error: "Goals module not available" };
    }

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        ...parsed,
        startDate: new Date(parsed.startDate),
        targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
        linkedAccountId: parsed.linkedAccountId || null,
        linkedDebtId: parsed.linkedDebtId || null,
        notes: parsed.notes || null,
        userId: user.id,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      data: {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
      }, 
      message: "Goal created successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid goal data" };
    }
    
    console.error("Error creating goal:", error);
    return { success: false, error: "Failed to create goal" };
  }
}

/**
 * Update an existing goal
 */
export async function updateGoal(id: string, formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = goalSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      targetAmount: formData.get("targetAmount"),
      startDate: formData.get("startDate"),
      targetDate: formData.get("targetDate"),
      linkedAccountId: formData.get("linkedAccountId"),
      linkedDebtId: formData.get("linkedDebtId"),
      autoTrack: formData.get("autoTrack"),
      priority: formData.get("priority"),
      notes: formData.get("notes"),
    });

    // Additional validation
    const validation = validateGoalData({
      ...parsed,
      startDate: new Date(parsed.startDate),
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : undefined,
    });

    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(", ") };
    }

    const user = await getDefaultUser();

    if (!prisma.goal) {
      return { success: false, error: "Goals module not available" };
    }

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingGoal) {
      return { success: false, error: "Goal not found" };
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...parsed,
        startDate: new Date(parsed.startDate),
        targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
        linkedAccountId: parsed.linkedAccountId || null,
        linkedDebtId: parsed.linkedDebtId || null,
        notes: parsed.notes || null,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      data: {
        ...updatedGoal,
        targetAmount: Number(updatedGoal.targetAmount),
        currentAmount: Number(updatedGoal.currentAmount),
      }, 
      message: "Goal updated successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid goal data" };
    }
    
    console.error(`Failed to update goal ${id}:`, error);
    return { success: false, error: "Failed to update goal" };
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string) {
  try {
    const user = await getDefaultUser();

    if (!prisma.goal) {
      return { success: false, error: "Goals module not available" };
    }

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingGoal) {
      return { success: false, error: "Goal not found" };
    }

    await prisma.goal.delete({
      where: { id },
    });

    // Revalidate relevant paths
    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { success: true, message: "Goal deleted successfully" };
  } catch (error) {
    console.error(`Failed to delete goal ${id}:`, error);
    return { success: false, error: "Failed to delete goal" };
  }
}

/**
 * Mark a goal as completed
 */
export async function completeGoal(id: string) {
  try {
    const user = await getDefaultUser();

    if (!prisma.goal) {
      return { success: false, error: "Goals module not available" };
    }

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingGoal) {
      return { success: false, error: "Goal not found" };
    }

    // Update goal to completed
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: { isCompleted: true },
    });

    // Revalidate relevant paths
    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { success: true, message: "Goal marked as completed" };
  } catch (error) {
    console.error(`Failed to complete goal ${id}:`, error);
    return { success: false, error: "Failed to complete goal" };
  }
}

/**
 * Add a contribution to a goal
 */
export async function addGoalContribution(goalId: string, formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = contributionSchema.parse({
      amount: formData.get("amount"),
      date: formData.get("date"),
      note: formData.get("note"),
      accountId: formData.get("accountId"),
    });

    const user = await getDefaultUser();

    if (!prisma.goal || !prisma.goalContribution) {
      return { success: false, error: "Goals module not available" };
    }

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!existingGoal) {
      return { success: false, error: "Goal not found" };
    }

    // Create the contribution
    const contribution = await prisma.goalContribution.create({
      data: {
        ...parsed,
        date: new Date(parsed.date),
        goalId,
        userId: user.id,
      },
    });

    // Update goal's current amount
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: {
          increment: parsed.amount,
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      data: {
        ...contribution,
        amount: Number(contribution.amount),
      }, 
      message: "Contribution added successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid contribution data" };
    }
    
    console.error("Error adding contribution:", error);
    return { success: false, error: "Failed to add contribution" };
  }
}

/**
 * Get goal contributions
 */
export async function getGoalContributions(goalId: string) {
  try {
    const user = await getDefaultUser();

    if (!prisma.goalContribution) {
      return { success: true, data: [] };
    }

    const contributions = await prisma.goalContribution.findMany({
      where: { 
        goalId,
        userId: user.id 
      },
      include: {
        account: true,
      },
      orderBy: { date: 'desc' },
    });

    return { 
      success: true, 
      data: contributions.map(c => ({
        ...c,
        amount: Number(c.amount),
      }))
    };
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return { success: false, error: "Failed to load contributions" };
  }
}

/**
 * Get goal summary for dashboard
 */
export async function getGoalSummary() {
  try {
    const result = await getGoals();
    
    if (!result.success) {
      return result;
    }

    const { calculateGoalSummary } = await import("@/lib/finance/goals");
    const summary = calculateGoalSummary([], result.data || []);

    return { success: true, data: summary };
  } catch (error) {
    console.error("Error getting goal summary:", error);
    return { success: false, error: "Failed to get goal summary" };
  }
}

/**
 * Get accounts for goal linking
 */
export async function getAccounts() {
  try {
    const user = await getDefaultUser();
    
    const accounts = await prisma.financialAccount.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    });

    return { 
      success: true, 
      data: accounts.map(account => ({
        ...account,
        balance: Number(account.balance),
      }))
    };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return { success: false, error: "Failed to load accounts" };
  }
}

/**
 * Get debts for goal linking
 */
export async function getDebts() {
  try {
    const user = await getDefaultUser();
    
    if (!prisma.debt) {
      return { success: true, data: [] };
    }

    const debts = await prisma.debt.findMany({
      where: { 
        userId: user.id,
        isClosed: false,
      },
      orderBy: { name: 'asc' },
    });

    return { 
      success: true, 
      data: debts.map(debt => ({
        ...debt,
        currentBalance: Number(debt.currentBalance),
        originalAmount: Number(debt.originalAmount || 0),
      }))
    };
  } catch (error) {
    console.error("Error fetching debts:", error);
    return { success: false, error: "Failed to load debts" };
  }
}
