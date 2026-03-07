"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DebtType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";

// Define the validation schema for debt creation/update
const debtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(DebtType),
  lender: z.string().optional(),
  originalAmount: z.coerce.number().optional(),
  currentBalance: z.coerce.number().min(0, "Current balance must be non-negative"),
  interestRateAPR: z.coerce.number().min(0).max(100).optional(),
  minimumPayment: z.coerce.number().min(0).optional(),
  dueDayOfMonth: z.coerce.number().min(1).max(31).optional(),
  notes: z.string().optional(),
  isClosed: z.boolean().default(false),
});

export type DebtFormValues = z.infer<typeof debtSchema>;

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
    const formattedDebts = debts.map(debt => ({
      ...debt,
      originalAmount: debt.originalAmount ? Number(debt.originalAmount) : null,
      currentBalance: Number(debt.currentBalance),
      interestRateAPR: debt.interestRateAPR ? Number(debt.interestRateAPR) : null,
      minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null,
    }));
    
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
    const formattedDebt = {
      ...debt,
      originalAmount: debt.originalAmount ? Number(debt.originalAmount) : null,
      currentBalance: Number(debt.currentBalance),
      interestRateAPR: debt.interestRateAPR ? Number(debt.interestRateAPR) : null,
      minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null,
    };
    
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
      originalAmount: formData.get("originalAmount"),
      currentBalance: formData.get("currentBalance"),
      interestRateAPR: formData.get("interestRateAPR"),
      minimumPayment: formData.get("minimumPayment"),
      dueDayOfMonth: formData.get("dueDayOfMonth"),
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
      data: {
        ...debt,
        originalAmount: debt.originalAmount ? Number(debt.originalAmount) : null,
        currentBalance: Number(debt.currentBalance),
        interestRateAPR: debt.interestRateAPR ? Number(debt.interestRateAPR) : null,
        minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null,
      }, 
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
      originalAmount: formData.get("originalAmount"),
      currentBalance: formData.get("currentBalance"),
      interestRateAPR: formData.get("interestRateAPR"),
      minimumPayment: formData.get("minimumPayment"),
      dueDayOfMonth: formData.get("dueDayOfMonth"),
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
      data: {
        ...updatedDebt,
        originalAmount: updatedDebt.originalAmount ? Number(updatedDebt.originalAmount) : null,
        currentBalance: Number(updatedDebt.currentBalance),
        interestRateAPR: updatedDebt.interestRateAPR ? Number(updatedDebt.interestRateAPR) : null,
        minimumPayment: updatedDebt.minimumPayment ? Number(updatedDebt.minimumPayment) : null,
      }, 
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
    
    // Update debt balance
    const newBalance = Number(debt.currentBalance) - paymentAmount;
    const isClosed = newBalance <= 0;
    
    await prisma.debt.update({
      where: { id: debtId },
      data: {
        currentBalance: newBalance,
        isClosed,
      },
    });
    
    // Create corresponding transaction
    await prisma.transaction.create({
      data: {
        date: (() => {
          // Parse the date string and create a consistent UTC date
          const [year, month, day] = paymentDate.split('-').map(Number);
          
          // Validate the parsed components
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw new Error(`Invalid date format: ${paymentDate}`);
          }
          
          const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
          console.log(`Debt payment date parsed: ${paymentDate} -> ${utcDate.toISOString()}`);
          
          // Validate the created date
          if (isNaN(utcDate.getTime())) {
            throw new Error(`Invalid date created from: ${paymentDate}`);
          }
          
          return utcDate;
        })(),
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
      message: `Payment of $${paymentAmount.toFixed(2)} made to ${debt.name}` 
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
    
    // Calculate next due payments
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const nextDuePayments = debts
      .filter(debt => debt.dueDayOfMonth && debt.minimumPayment && Number(debt.minimumPayment) > 0)
      .map(debt => {
        let dueDate = new Date(currentYear, currentMonth, debt.dueDayOfMonth!);
        
        // If due date has passed this month, move to next month
        if (dueDate < today) {
          dueDate = new Date(currentYear, currentMonth + 1, debt.dueDayOfMonth!);
        }
        
        return {
          id: debt.id,
          name: debt.name,
          dueDate: dueDate.toISOString().split('T')[0],
          dueDayOfMonth: debt.dueDayOfMonth,
          minimumPayment: Number(debt.minimumPayment),
          currentBalance: Number(debt.currentBalance),
          type: debt.type,
          lender: debt.lender,
        };
      })
      .slice(0, 5); // Show next 5 due payments
    
    return {
      success: true,
      data: {
        totalBalance,
        totalMinimumPayments,
        openDebtCount: debts.length,
        nextDuePayments,
      },
    };
  } catch (error) {
    console.error("Failed to get debt summary:", error);
    return { success: false, error: "Failed to load debt summary" };
  }
}
