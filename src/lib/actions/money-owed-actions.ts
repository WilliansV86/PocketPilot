"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { correctedReceivable } from "@/lib/receivable-correction";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { getAccounts } from "./account-actions";
import { getCategories } from "./category-actions";
import { formatCurrency } from "@/lib/utils";

// Define the validation schema for money owed creation
const moneyOwedSchema = z.object({
  currency: z.enum(["USD", "CAD"]).default("USD"),
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
      currency: formData.get("currency") || "USD",
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

    const { personName, description, amountOriginal, dueDate, currency } = validatedFields.data;

    // Create money owed record
    const moneyOwed = await prisma.moneyOwed.create({
      data: {
        personName,
        description,
        amountOriginal,
        amountOutstanding: amountOriginal,
        currency,
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

    // Validate form data
    const validatedFields = moneyOwedSchema.safeParse({
      personName: formData.get("personName"),
      currency: formData.get("currency") || "USD",
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

    const { personName, description, amountOriginal, dueDate, currency } = validatedFields.data;

    const result = await prisma.$transaction(async tx => {
      const existing = await tx.moneyOwed.findFirst({
        where: { id, userId: user.id, isArchived: false },
        include: { payments: true },
      });
      if (!existing) return { success: false as const, error: "Money owed record not found" };
      if (existing.payments.length > 0 && currency !== existing.currency) {
        return { success: false as const, error: "Currency cannot change after payments have been recorded." };
      }
      let correction;
      try {
        correction = correctedReceivable(amountOriginal, existing.payments.map(payment => Number(payment.amount)));
      } catch (error) {
        return { success: false as const, error: error instanceof Error ? error.message : "Invalid original amount." };
      }
      const moneyOwed = await tx.moneyOwed.update({
        where: { id, userId: user.id },
        data: { currency, personName, description, dueDate: dueDate ? new Date(dueDate) : null, ...correction },
      });
      return { success: true as const, moneyOwed };
    }, { isolationLevel: "Serializable" });
    if (!result.success) return result;
    const moneyOwed = result.moneyOwed;

    // Revalidate relevant paths
    revalidatePath("/money-owed");
    revalidatePath("/dashboard");
    revalidatePath("/");
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
function parseReceivablePayment(formData: FormData) {
  const parsed = paymentSchema.safeParse({ amount: formData.get("amount"), date: formData.get("date"), accountId: formData.get("accountId"), note: formData.get("note") });
  if (!parsed.success) throw new Error("Enter a valid payment amount, date, and receiving account.");
  const { amount, date, accountId, note } = parsed.data;
  correctedReceivable(amount, []);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Enter a valid payment date.");
  const paymentDate = new Date(`${date}T12:00:00.000Z`);
  if (!Number.isFinite(paymentDate.getTime()) || paymentDate.toISOString().slice(0, 10) !== date) throw new Error("Enter a valid payment date.");
  return { amount, date: paymentDate, accountId, note };
}

async function saveReceivablePayment(moneyOwedId: string, formData: FormData, paymentId?: string) {
  try {
    const user = await getDefaultUser();
    const values = parseReceivablePayment(formData);
    const result = await prisma.$transaction(async tx => {
      const owed = await tx.moneyOwed.findFirst({ where: { id: moneyOwedId, userId: user.id, isArchived: false }, include: { payments: true } });
      if (!owed) throw new Error("Money owed record not found.");
      const previous = paymentId ? owed.payments.find(p => p.id === paymentId && p.userId === user.id) : undefined;
      if (paymentId && !previous) throw new Error("Payment not found.");
      const receiving = await tx.financialAccount.findFirst({ where: { id: values.accountId, userId: user.id } });
      if (!receiving || receiving.currency !== owed.currency) throw new Error("Choose a receiving account in the same currency as the money owed.");
      const correction = correctedReceivable(Number(owed.amountOriginal), [
        ...owed.payments.filter(p => p.id !== paymentId).map(p => Number(p.amount)), values.amount,
      ]);
      let linked;
      if (previous) {
        if (previous.transactionId) {
          linked = await tx.transaction.findFirst({ where: { id: previous.transactionId, userId: user.id, type: "INCOME" } });
        } else {
          // Older payments predate the explicit link. Match only when unambiguous.
          const candidates = await tx.transaction.findMany({ where: {
            userId: user.id, accountId: previous.accountId, date: previous.date, amount: previous.amount,
            type: "INCOME", description: { startsWith: "Payment received from " }, category: { name: "Receivable Payment" },
          }, take: 2 });
          const duplicates = await tx.moneyOwedPayment.count({ where: { userId: user.id, accountId: previous.accountId, date: previous.date, amount: previous.amount } });
          if (candidates.length === 1 && duplicates === 1) linked = candidates[0];
        }
        if (!linked || linked.accountId !== previous.accountId || Number(linked.amount) !== Number(previous.amount)) {
          throw new Error("This older payment could not be safely matched to its transaction. No changes were saved.");
        }
        await tx.financialAccount.update({ where: { id: previous.accountId, userId: user.id }, data: { balance: { decrement: previous.amount } } });
      }
      let category = await tx.category.findFirst({ where: { userId: user.id, name: "Receivable Payment", group: "INCOME" } });
      if (!category) category = await tx.category.create({ data: { userId: user.id, name: "Receivable Payment", group: "INCOME", color: "#10B981", isArchived: false, icon: "dollar-sign" } });
      const transactionData = { userId: user.id, date: values.date, amount: values.amount,
        description: `Payment received from ${owed.personName}`, type: "INCOME" as const,
        notes: values.note || `Receivable payment: ${owed.personName}`, accountId: values.accountId, categoryId: category.id };
      const transaction = linked
        ? await tx.transaction.update({ where: { id: linked.id, userId: user.id }, data: transactionData })
        : await tx.transaction.create({ data: transactionData });
      const paymentData = { ...values, transactionId: transaction.id };
      if (previous) await tx.moneyOwedPayment.update({ where: { id: previous.id, userId: user.id }, data: paymentData });
      else await tx.moneyOwedPayment.create({ data: { ...paymentData, moneyOwedId, userId: user.id } });
      await tx.financialAccount.update({ where: { id: values.accountId, userId: user.id }, data: { balance: { increment: values.amount } } });
      await tx.moneyOwed.update({ where: { id: moneyOwedId, userId: user.id }, data: correction });
      return { success: true as const, message: previous ? "Payment updated successfully" : "Payment recorded successfully" };
    }, { isolationLevel: "Serializable" });
    for (const path of ["/money-owed", "/transactions", "/accounts", "/dashboard", "/", "/budgets", "/stats"]) revalidatePath(path);
    return result;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) return { success: false as const, error: "Could not save the payment. Refresh and try again." };
    return { success: false as const, error: error instanceof Error ? error.message : "Failed to save payment." };
  }
}

export async function recordMoneyOwedPayment(moneyOwedId: string, formData: FormData) {
  return saveReceivablePayment(moneyOwedId, formData);
}

export async function updateMoneyOwedPayment(moneyOwedId: string, paymentId: string, formData: FormData) {
  return saveReceivablePayment(moneyOwedId, formData, paymentId);
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
export async function getMoneyOwedSummary(currency = "USD") {
  try {
    const user = await getDefaultUser();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const summary = await prisma.moneyOwed.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
        currency,
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
        currency,
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
