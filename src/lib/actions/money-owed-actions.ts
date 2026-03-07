"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { getAccounts } from "./account-actions";
import { getCategories } from "./category-actions";
import { formatCurrency } from "@/lib/utils";

// Define the validation schema for money owed creation
const moneyOwedSchema = z.object({
  personName: z.string().min(1, "Person name is required"),
  description: z.string().optional(),
  amountOriginal: z.coerce.number().positive("Original amount must be positive"),
  dueDate: z.string().optional(),
});

// Define the validation schema for payment recording
const paymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  date: z.string().min(1, "Payment date is required"),
  accountId: z.string().min(1, "Account is required"),
  note: z.string().optional(),
});

// Helper function to ensure receivable payment category exists
async function ensureReceivableCategory(userId: string) {
  try {
    // Check if "Receivable Payment" category exists in INCOME group
    let category = await prisma.category.findFirst({
      where: {
        userId,
        name: "Receivable Payment",
        group: "INCOME",
      },
    });

    // If not found, create it
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Receivable Payment",
          group: "INCOME",
          color: "#10B981", // Green color for income
          userId,
          isArchived: false,
          icon: "dollar-sign",
        },
      });
    }

    return category;
  } catch (error) {
    console.error("Error ensuring receivable category:", error);
    throw new Error("Failed to ensure receivable category exists");
  }
}

// Get all money owed records
export async function getMoneyOwed() {
  try {
    const user = await getDefaultUser();

    // Check if moneyOwed model exists in prisma client
    if (!prisma.moneyOwed) {
      console.warn("MoneyOwed model not found in Prisma client, returning empty data");
      return {
        success: true,
        data: [],
      };
    }

    const moneyOwed = await prisma.moneyOwed.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      include: {
        payments: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: [
        { status: "asc" }, // OPEN first, then PARTIAL, then PAID
        { dueDate: "asc" }, // Earliest due date first
        { createdAt: "desc" }, // Newest first for same status
      ],
    });

    return {
      success: true,
      data: moneyOwed.map((item) => ({
        ...item,
        amountOriginal: Number(item.amountOriginal),
        amountOutstanding: Number(item.amountOutstanding),
        payments: item.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      })),
    };
  } catch (error) {
    console.error("Error getting money owed:", error);
    return {
      success: false,
      error: "Failed to get money owed records",
    };
  }
}

// Get money owed by ID
export async function getMoneyOwedById(id: string) {
  try {
    const user = await getDefaultUser();

    const moneyOwed = await prisma.moneyOwed.findFirst({
      where: {
        id,
        userId: user.id,
        isArchived: false,
      },
      include: {
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!moneyOwed) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    return {
      success: true,
      data: {
        ...moneyOwed,
        amountOriginal: Number(moneyOwed.amountOriginal),
        amountOutstanding: Number(moneyOwed.amountOutstanding),
        payments: moneyOwed.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      },
    };
  } catch (error) {
    console.error("Error getting money owed by ID:", error);
    return {
      success: false,
      error: "Failed to get money owed record",
    };
  }
}

// Create money owed record
export async function createMoneyOwed(formData: FormData) {
  try {
    // Check if moneyOwed model exists in prisma client
    if (!prisma.moneyOwed) {
      return {
        success: false,
        error: "Money Owed functionality is not available. Please contact administrator.",
      };
    }

    const user = await getDefaultUser();

    // Validate form data
    const validatedFields = moneyOwedSchema.safeParse({
      personName: formData.get("personName"),
      description: formData.get("description"),
      amountOriginal: formData.get("amountOriginal"),
      dueDate: formData.get("dueDate"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid form data",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { personName, description, amountOriginal, dueDate } = validatedFields.data;

    // Create money owed record
    const moneyOwed = await prisma.moneyOwed.create({
      data: {
        personName,
        description,
        amountOriginal,
        amountOutstanding: amountOriginal,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "OPEN",
        userId: user.id,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/debts");

    return {
      success: true,
      message: "Money owed record created successfully",
      data: {
        ...moneyOwed,
        amountOriginal: Number(moneyOwed.amountOriginal),
        amountOutstanding: Number(moneyOwed.amountOutstanding),
      },
    };
  } catch (error) {
    console.error("Error creating money owed:", error);
    return {
      success: false,
      error: "Failed to create money owed record",
    };
  }
}

// Update money owed record
export async function updateMoneyOwed(id: string, formData: FormData) {
  try {
    const user = await getDefaultUser();

    // Get existing record
    const existing = await prisma.moneyOwed.findFirst({
      where: {
        id,
        userId: user.id,
        isArchived: false,
      },
      include: {
        payments: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    // Validate form data
    const validatedFields = moneyOwedSchema.safeParse({
      personName: formData.get("personName"),
      description: formData.get("description"),
      amountOriginal: formData.get("amountOriginal"),
      dueDate: formData.get("dueDate"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid form data",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { personName, description, amountOriginal, dueDate } = validatedFields.data;

    // Check if there are payments - if so, don't allow changing amountOriginal
    const hasPayments = existing.payments.length > 0;
    
    const updateData: any = {
      personName,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    // Only allow updating amountOriginal if no payments exist
    if (!hasPayments) {
      updateData.amountOriginal = amountOriginal;
      updateData.amountOutstanding = amountOriginal;
      updateData.status = "OPEN";
    }

    // Update record
    const moneyOwed = await prisma.moneyOwed.update({
      where: { id },
      data: updateData,
    });

    // Revalidate relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/debts");

    return {
      success: true,
      message: "Money owed record updated successfully",
      data: {
        ...moneyOwed,
        amountOriginal: Number(moneyOwed.amountOriginal),
        amountOutstanding: Number(moneyOwed.amountOutstanding),
      },
    };
  } catch (error) {
    console.error("Error updating money owed:", error);
    return {
      success: false,
      error: "Failed to update money owed record",
    };
  }
}

// Archive money owed record
export async function archiveMoneyOwed(id: string) {
  try {
    const user = await getDefaultUser();

    // Check if record exists and belongs to user
    const existing = await prisma.moneyOwed.findFirst({
      where: {
        id,
        userId: user.id,
        isArchived: false,
      },
      include: {
        payments: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    // If there are payments, don't allow archiving
    if (existing.payments.length > 0) {
      return {
        success: false,
        error: "Cannot archive record with existing payments",
      };
    }

    // Archive the record
    await prisma.moneyOwed.update({
      where: { id },
      data: { isArchived: true },
    });

    // Revalidate relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/debts");

    return {
      success: true,
      message: "Money owed record archived successfully",
    };
  } catch (error) {
    console.error("Error archiving money owed:", error);
    return {
      success: false,
      error: "Failed to archive money owed record",
    };
  }
}

// Force delete money owed record (even with payments)
export async function deleteMoneyOwed(id: string) {
  try {
    const user = await getDefaultUser();

    // Check if record exists and belongs to user
    const existing = await prisma.moneyOwed.findFirst({
      where: {
        id,
        userId: user.id,
        isArchived: false,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    // Delete all associated payments first
    await prisma.moneyOwedPayment.deleteMany({
      where: {
        moneyOwedId: id,
      },
    });

    // Delete the money owed record
    await prisma.moneyOwed.delete({
      where: { id },
    });

    // Revalidate relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/debts");

    return {
      success: true,
      message: "Money owed record deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting money owed:", error);
    return {
      success: false,
      error: "Failed to delete money owed record",
    };
  }
}

// Record payment for money owed
export async function recordMoneyOwedPayment(moneyOwedId: string, formData: FormData) {
  try {
    const user = await getDefaultUser();

    // Validate form data
    const validatedFields = paymentSchema.safeParse({
      amount: formData.get("amount"),
      date: formData.get("date"),
      accountId: formData.get("accountId"),
      note: formData.get("note"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid payment data",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { amount, date, accountId, note } = validatedFields.data;

    // Get money owed record
    const moneyOwed = await prisma.moneyOwed.findFirst({
      where: {
        id: moneyOwedId,
        userId: user.id,
        isArchived: false,
      },
    });

    if (!moneyOwed) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    // Validate payment amount
    if (amount > Number(moneyOwed.amountOutstanding)) {
      return {
        success: false,
        error: "Payment amount cannot exceed outstanding amount",
      };
    }

    // Get account to validate it exists and belongs to user
    const account = await prisma.financialAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return {
        success: false,
        error: "Account not found",
      };
    }

    // Create payment record
    const payment = await prisma.moneyOwedPayment.create({
      data: {
        amount,
        date: (() => {
          // Parse the date string and create a consistent UTC date
          const [year, month, day] = date.split('-').map(Number);
          
          // Validate the parsed components
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new Error(`Invalid date format: ${date}`);
          }
          
          const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
          console.log(`Payment date parsed: ${date} -> ${utcDate.toISOString()}`);
          
          // Validate the created date
          if (isNaN(utcDate.getTime())) {
            throw new Error(`Invalid date created from: ${date}`);
          }
          
          return utcDate;
        })(),
        note,
        moneyOwedId,
        accountId,
        userId: user.id,
      },
    });

    // Update money owed record
    const newOutstanding = Number(moneyOwed.amountOutstanding) - amount;
    const newStatus = newOutstanding === 0 ? "PAID" : "PARTIAL";

    await prisma.moneyOwed.update({
      where: { id: moneyOwedId },
      data: {
        amountOutstanding: newOutstanding,
        status: newStatus,
      },
    });

    // Update account balance (increase for received money)
    await prisma.financialAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    // Create corresponding transaction
    const receivableCategory = await ensureReceivableCategory(user.id);

    await prisma.transaction.create({
      data: {
        date: (() => {
          // Parse the date string and create a consistent UTC date
          const [year, month, day] = date.split('-').map(Number);
          
          // Validate the parsed components
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new Error(`Invalid date format: ${date}`);
          }
          
          const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
          console.log(`Transaction date parsed: ${date} -> ${utcDate.toISOString()}`);
          
          // Validate the created date
          if (isNaN(utcDate.getTime())) {
            throw new Error(`Invalid date created from: ${date}`);
          }
          
          return utcDate;
        })(),
        amount: amount, // Positive for income
        description: `Payment received from ${moneyOwed.personName}`,
        type: "INCOME",
        notes: note || `Receivable payment: ${moneyOwed.personName}`,
        accountId,
        categoryId: receivableCategory.id,
        userId: user.id,
      },
    });

    // Revalidate all relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Payment of ${formatCurrency(amount)} recorded successfully`,
      data: {
        payment,
        updatedMoneyOwed: moneyOwed,
      },
    };
  } catch (error) {
    console.error("Error recording payment:", error);
    return {
      success: false,
      error: "Failed to record payment",
    };
  }
}

// Mark money owed as paid (manual override)
export async function markMoneyOwedAsPaid(id: string) {
  try {
    const user = await getDefaultUser();

    // Get existing record
    const existing = await prisma.moneyOwed.findFirst({
      where: {
        id,
        userId: user.id,
        isArchived: false,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    // Only allow marking as paid if outstanding amount is 0
    if (Number(existing.amountOutstanding) !== 0) {
      return {
        success: false,
        error: "Can only mark as paid if outstanding amount is zero",
      };
    }

    // Update status to PAID
    await prisma.moneyOwed.update({
      where: { id },
      data: { status: "PAID" },
    });

    // Revalidate relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/debts");

    return {
      success: true,
      message: "Money owed record marked as paid",
    };
  } catch (error) {
    console.error("Error marking money owed as paid:", error);
    return {
      success: false,
      error: "Failed to mark money owed as paid",
    };
  }
}

// Get money owed summary statistics
export async function getMoneyOwedSummary() {
  try {
    const user = await getDefaultUser();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const summary = await prisma.moneyOwed.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
        isArchived: false,
        status: {
          not: "PAID",
        },
      },
      _sum: {
        amountOutstanding: true,
      },
      _count: {
        id: true,
      },
    });

    // Get overdue count
    const overdueCount = await prisma.moneyOwed.count({
      where: {
        userId: user.id,
        isArchived: false,
        status: {
          not: "PAID",
        },
        dueDate: {
          lt: today,
        },
      },
    });

    // Calculate totals
    let totalOutstanding = 0;
    let openCount = 0;
    let partialCount = 0;

    summary.forEach((item) => {
      const outstanding = Number(item._sum.amountOutstanding || 0);
      const count = item._count.id;

      totalOutstanding += outstanding;

      if (item.status === "OPEN") {
        openCount = count;
      } else if (item.status === "PARTIAL") {
        partialCount = count;
      }
    });

    return {
      success: true,
      data: {
        totalOutstanding,
        openCount,
        partialCount,
        overdueCount,
        totalCount: openCount + partialCount,
      },
    };
  } catch (error) {
    console.error("Error getting money owed summary:", error);
    return {
      success: false,
      error: "Failed to get money owed summary",
    };
  }
}

// Get payments for a specific money owed record
export async function getMoneyOwedPayments(moneyOwedId: string) {
  try {
    const user = await getDefaultUser();

    // Verify the money owed record belongs to the user
    const moneyOwed = await prisma.moneyOwed.findFirst({
      where: {
        id: moneyOwedId,
        userId: user.id,
        isArchived: false,
      },
    });

    if (!moneyOwed) {
      return {
        success: false,
        error: "Money owed record not found",
      };
    }

    const payments = await prisma.moneyOwedPayment.findMany({
      where: {
        moneyOwedId,
        userId: user.id,
      },
      include: {
        account: true,
      },
      orderBy: { date: "desc" },
    });

    return {
      success: true,
      data: payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        accountName: payment.account.name,
      })),
    };
  } catch (error) {
    console.error("Error getting money owed payments:", error);
    return {
      success: false,
      error: "Failed to get payments",
    };
  }
}

export type MoneyOwedFormData = z.infer<typeof moneyOwedSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
