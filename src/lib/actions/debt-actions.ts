"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DebtType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { formatMoney } from "@/lib/currency";
import {
  buildDebtReminders,
  nextMonthlyOccurrence,
  paymentCycleKey,
  toLocalDateKey,
} from "@/lib/debt-reminders";

const optionalNumber = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    value => value === "" || value === null || value === undefined ? undefined : value,
    schema.optional(),
  );

// Define the validation schema for debt creation/update
const debtSchema = z.object({
  currency: z.enum(["USD", "CAD"]).default("USD"),
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(DebtType),
  lender: z.string().optional(),
  originalAmount: optionalNumber(z.coerce.number().positive()),
  currentBalance: z.coerce.number().min(0, "Current balance must be non-negative"),
  interestRateAPR: optionalNumber(z.coerce.number().min(0).max(100)),
  minimumPayment: optionalNumber(z.coerce.number().min(0)),
  dueDayOfMonth: optionalNumber(z.coerce.number().int().min(1).max(31)),
  creditLimit: optionalNumber(z.coerce.number().positive()),
  statementClosingDay: optionalNumber(z.coerce.number().int().min(1).max(31)),
  notes: z.string().optional(),
  isClosed: z.boolean().default(false),
});

export type DebtFormValues = z.infer<typeof debtSchema>;

function formatDebt(debt: any, today = new Date()) {
  const currentCycle = debt.dueDayOfMonth
    ? paymentCycleKey(debt.dueDayOfMonth, today)
    : null;
  const amountPaid = currentCycle && debt.minimumPaymentCycle === currentCycle
    ? Number(debt.minimumPaymentPaid)
    : 0;
  const minimumPayment = debt.minimumPayment ? Number(debt.minimumPayment) : null;

  return {
    ...debt,
    originalAmount: debt.originalAmount ? Number(debt.originalAmount) : null,
    currentBalance: Number(debt.currentBalance),
    interestRateAPR: debt.interestRateAPR ? Number(debt.interestRateAPR) : null,
    minimumPayment,
    creditLimit: debt.creditLimit ? Number(debt.creditLimit) : null,
    minimumPaymentPaid: amountPaid,
    minimumPaymentRemaining: minimumPayment === null
      ? null
      : Math.max(minimumPayment - amountPaid, 0),
    nextDueDate: debt.dueDayOfMonth
      ? toLocalDateKey(nextMonthlyOccurrence(debt.dueDayOfMonth, today))
      : null,
    nextStatementClosingDate: debt.statementClosingDay
      ? toLocalDateKey(nextMonthlyOccurrence(debt.statementClosingDay, today))
      : null,
  };
}

// Get all debts for the user
export async function getDebts() {
  try {
    const user = await getDefaultUser();
    
    const debts = await prisma.debt.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { isClosed: "asc" }, // Open debts first
        { name: "asc" },
      ],
    });
    
    // Convert Decimal amounts to numbers for frontend compatibility
    const formattedDebts = debts.map(debt => formatDebt(debt));
    
    return { success: true, data: formattedDebts };
  } catch (error) {
    console.error("Failed to fetch debts:", error);
    return { success: false, error: "Failed to load debts" };
  }
}

// Get a single debt by ID
export async function getDebtById(id: string) {
  try {
    const user = await getDefaultUser();
    
    const debt = await prisma.debt.findUnique({
      where: { 
        id,
        userId: user.id, // Ensure the debt belongs to this user
      },
    });
    
    if (!debt) {
      return { success: false, error: "Debt not found" };
    }
    
    // Convert Decimal amounts to numbers for frontend compatibility
    const formattedDebt = formatDebt(debt);
    
    return { success: true, data: formattedDebt };
  } catch (error) {
    console.error(`Failed to fetch debt ${id}:`, error);
    return { success: false, error: "Failed to load debt details" };
  }
}

// Create a new debt
export async function createDebt(formData: FormData) {
  try {
    const parsed = debtSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      lender: formData.get("lender"),
      currency: formData.get("currency") || "USD",
      originalAmount: formData.get("originalAmount"),
      currentBalance: formData.get("currentBalance"),
      interestRateAPR: formData.get("interestRateAPR"),
      minimumPayment: formData.get("minimumPayment"),
      dueDayOfMonth: formData.get("dueDayOfMonth"),
      creditLimit: formData.get("creditLimit"),
      statementClosingDay: formData.get("statementClosingDay"),
      notes: formData.get("notes"),
      isClosed: formData.get("isClosed") === "true",
    });
    
    const user = await getDefaultUser();
    
    const debt = await prisma.debt.create({
      data: {
        ...parsed,
        userId: user.id,
      },
    });
    
    revalidatePath("/debts");
    return { 
      success: true, 
      data: formatDebt(debt),
      message: "Debt created successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid debt data" };
    }
    
    console.error("Failed to create debt:", error);
    return { success: false, error: "Failed to create debt" };
  }
}

// Update an existing debt
export async function updateDebt(id: string, formData: FormData) {
  try {
    const parsed = debtSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      lender: formData.get("lender"),
      currency: formData.get("currency") || "USD",
      originalAmount: formData.get("originalAmount"),
      currentBalance: formData.get("currentBalance"),
      interestRateAPR: formData.get("interestRateAPR"),
      minimumPayment: formData.get("minimumPayment"),
      dueDayOfMonth: formData.get("dueDayOfMonth"),
      creditLimit: formData.get("creditLimit"),
      statementClosingDay: formData.get("statementClosingDay"),
      notes: formData.get("notes"),
      isClosed: formData.get("isClosed") === "true",
    });
    
    const user = await getDefaultUser();
    
    // Check if debt exists and belongs to user
    const existingDebt = await prisma.debt.findUnique({
      where: { id },
    });
    
    if (!existingDebt || existingDebt.userId !== user.id) {
      return { success: false, error: "Debt not found" };
    }
    
    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: parsed,
    });
    
    revalidatePath("/debts");
    return { 
      success: true, 
      data: formatDebt(updatedDebt),
      message: "Debt updated successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid debt data" };
    }
    
    console.error(`Failed to update debt ${id}:`, error);
    return { success: false, error: "Failed to update debt" };
  }
}

// Delete a debt
export async function deleteDebt(id: string) {
  try {
    const user = await getDefaultUser();
    
    // Check if debt exists and belongs to user
    const existingDebt = await prisma.debt.findUnique({
      where: { id },
    });
    
    if (!existingDebt || existingDebt.userId !== user.id) {
      return { success: false, error: "Debt not found" };
    }
    
    await prisma.debt.delete({
      where: { id },
    });
    
    revalidatePath("/debts");
    return { success: true, message: "Debt deleted successfully" };
  } catch (error) {
    console.error(`Failed to delete debt ${id}:`, error);
    return { success: false, error: "Failed to delete debt" };
  }
}

// Make a payment on a debt
export async function makeDebtPayment(debtId: string, paymentAmount: number, paymentDate: string, accountId: string, categoryId?: string) {
  try {
    const user = await getDefaultUser();
    
    // Get the debt
    const debt = await prisma.debt.findUnique({
      where: { 
        id: debtId,
        userId: user.id,
      },
    });
    
    if (!debt) {
      return { success: false, error: "Debt not found" };
    }
    const paymentAccount = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!paymentAccount) {
      return { success: false, error: "Payment account not found" };
    }
    if (paymentAccount.currency !== debt.currency) {
      return { success: false, error: "Choose an account with the same currency as this debt. Cross-currency payments are not supported yet." };
    }
    
    if (paymentAmount <= 0) {
      return { success: false, error: "Payment amount must be positive" };
    }
    
    if (paymentAmount > Number(debt.currentBalance)) {
      return { success: false, error: "Payment amount exceeds current balance" };
    }
    
    // Auto-create "Debt Payment" category if not provided or doesn't exist
    let debtPaymentCategoryId = categoryId;
    if (!debtPaymentCategoryId) {
      let debtPaymentCategory = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: "Debt Payment",
          group: "DEBT",
        },
      });
      
      if (!debtPaymentCategory) {
        debtPaymentCategory = await prisma.category.create({
          data: {
            name: "Debt Payment",
            group: "DEBT",
            color: "#ef4444",
            icon: "credit-card",
            userId: user.id,
          },
        });
      }
      
      debtPaymentCategoryId = debtPaymentCategory.id;
    }
    
    const [year, month, day] = paymentDate.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { success: false, error: "Invalid payment date" };
    }
    const parsedPaymentDate = new Date(Date.UTC(year, month - 1, day, 12));

    // Update debt balance and this cycle's minimum-payment progress.
    const newBalance = Number(debt.currentBalance) - paymentAmount;
    const isClosed = debt.type === "CREDIT_CARD" ? debt.isClosed : newBalance <= 0;
    const cycleKey = debt.dueDayOfMonth
      ? paymentCycleKey(debt.dueDayOfMonth, parsedPaymentDate)
      : null;
    const previousCycleAmount = cycleKey && debt.minimumPaymentCycle === cycleKey
      ? Number(debt.minimumPaymentPaid)
      : 0;
    
    await prisma.debt.update({
      where: { id: debtId },
      data: {
        currentBalance: newBalance,
        isClosed,
        minimumPaymentCycle: cycleKey,
        minimumPaymentPaid: previousCycleAmount + paymentAmount,
      },
    });
    
    // Create corresponding transaction
    await prisma.transaction.create({
      data: {
        date: parsedPaymentDate,
        amount: paymentAmount,
        description: `Payment to ${debt.name}`,
        type: "EXPENSE",
        notes: `Debt payment: ${debt.name}`,
        accountId,
        categoryId: debtPaymentCategoryId,
        userId: user.id,
      },
    });
    
    // Update account balance
    await prisma.financialAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          decrement: paymentAmount,
        },
      },
    });
    
    // Revalidate all relevant paths
    revalidatePath("/debts");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/stats");
    revalidatePath("/");
    
    return { 
      success: true, 
      message: `Payment of ${formatMoney(paymentAmount, debt.currency)} made to ${debt.name}`
    };
  } catch (error) {
    console.error("Failed to make debt payment:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

// Get debt summary statistics
export async function getDebtSummary() {
  try {
    const user = await getDefaultUser();
    
    const debts = await prisma.debt.findMany({
      where: {
        userId: user.id,
        isClosed: false,
      },
      orderBy: [
        { dueDayOfMonth: 'asc' },
        { name: 'asc' },
      ],
    });
    
    const totalBalance = debts.reduce((sum, debt) => sum + Number(debt.currentBalance), 0);
    const totalMinimumPayments = debts.reduce((sum, debt) => sum + (Number(debt.minimumPayment) || 0), 0);
    
    const today = new Date();
    const formattedDebts = debts.map(debt => formatDebt(debt, today));
    const totalsByCurrency = ["USD", "CAD"].map(currency => {
      const matching = debts.filter(debt => debt.currency === currency);
      return {
        currency,
        totalBalance: matching.reduce((sum, debt) => sum + Number(debt.currentBalance), 0),
        totalMinimumPayments: matching.reduce((sum, debt) => sum + Number(debt.minimumPayment || 0), 0),
      };
    });
    const upcomingReminders = buildDebtReminders(formattedDebts, today, 31);
    const nextDuePayments = upcomingReminders
      .filter(reminder => reminder.kind === "PAYMENT_DUE")
      .slice(0, 5)
      .map(reminder => {
        const debt = formattedDebts.find(item => item.id === reminder.debtId)!;
        return {
          id: reminder.debtId,
          name: reminder.name,
          dueDate: reminder.date,
          dueDayOfMonth: debt.dueDayOfMonth,
          minimumPayment: reminder.amount || 0,
          currentBalance: debt.currentBalance,
          type: debt.type,
          lender: reminder.lender,
          daysUntil: reminder.daysUntil,
        };
      });
    
    return {
      success: true,
      data: {
        totalBalance,
        totalMinimumPayments,
        totalsByCurrency,
        openDebtCount: debts.length,
        nextDuePayments,
        upcomingReminders: upcomingReminders.slice(0, 8),
      },
    };
  } catch (error) {
    console.error("Failed to get debt summary:", error);
    return { success: false, error: "Failed to load debt summary" };
  }
}
