"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";

// Define account types as constants for the updated schema
const ACCOUNT_TYPES = [
  "CHECKING",
  "SAVINGS",
  "CREDIT",
  "CASH",
  "INVESTMENT",
  "LOAN",
  "OTHER",
] as const;

// Define the validation schema for account creation
const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.coerce.number().default(0),
  currency: z.string().default("USD"),
});

export async function getAccounts() {
  try {
    // Get the default user with production-safe fallback
    const user = await getDefaultUser();
    
    const accounts = await prisma.financialAccount.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });
    
    // Convert Decimal balances to numbers for frontend compatibility
    const formattedAccounts = accounts.map(account => ({
      ...account,
      balance: Number(account.balance),
    }));
    
    return { success: true, data: formattedAccounts };
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return { success: false, error: "Failed to fetch accounts" };
  }
}

export async function getAccountById(id: string) {
  try {
    const account = await prisma.financialAccount.findUnique({
      where: { id },
    });
    
    if (!account) {
      return { success: false, error: "Account not found" };
    }
    
    // Convert Decimal balance to number for frontend compatibility
    const formattedAccount = {
      ...account,
      balance: Number(account.balance),
    };
    
    return { success: true, data: formattedAccount };
  } catch (error) {
    console.error(`Failed to fetch account ${id}:`, error);
    return { success: false, error: "Failed to load account details" };
  }
}

export async function createAccount(formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = accountSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      balance: formData.get("balance"),
      currency: formData.get("currency"),
    });
    
    // Get the default user
    const user = await getDefaultUser();
    
    // Create the account
    const account = await prisma.financialAccount.create({
      data: {
        ...parsed,
        userId: user.id,
      },
    });
    
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/debts");
    revalidatePath("/money-owed");
    return { 
      success: true, 
      data: {
        ...account,
        balance: Number(account.balance),
      }, 
      message: "Account created successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid account data" };
    }
    
    console.error("Failed to create account:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function updateAccount(id: string, formData: FormData) {
  try {
    // Parse and validate the form data
    const parsed = accountSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      balance: formData.get("balance"),
      currency: formData.get("currency"),
    });
    
    // Get the default user
    const user = await getDefaultUser();
    
    // First check if account exists and belongs to user
    const existingAccount = await prisma.financialAccount.findUnique({
      where: { id },
    });
    
    if (!existingAccount || existingAccount.userId !== user.id) {
      return { success: false, error: "Account not found" };
    }
    
    // Update the account
    const updatedAccount = await prisma.financialAccount.update({
      where: { id },
      data: parsed,
    });
    
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/debts");
    revalidatePath("/money-owed");
    return { 
      success: true, 
      data: {
        ...updatedAccount,
        balance: Number(updatedAccount.balance),
      }, 
      message: "Account updated successfully" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
      return { success: false, error: "Invalid account data" };
    }
    
    console.error(`Failed to update account ${id}:`, error);
    return { success: false, error: "Failed to update account" };
  }
}

export async function deleteAccount(id: string) {
  try {
    // Get the default user
    const user = await getDefaultUser();
    
    // First check if account exists and belongs to user
    const existingAccount = await prisma.financialAccount.findUnique({
      where: { id },
    });
    
    if (!existingAccount || existingAccount.userId !== user.id) {
      return { success: false, error: "Account not found" };
    }
    
    // Check if account has transactions before deleting
    const transactionCount = await prisma.transaction.count({
      where: { accountId: id },
    });

    if (transactionCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete account: ${transactionCount} transactions are linked to it. Transfer or delete these transactions first.`
      };
    }

    await prisma.financialAccount.delete({
      where: { id },
    });
    
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/debts");
    revalidatePath("/money-owed");
    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    console.error(`Failed to delete account ${id}:`, error);
    return { success: false, error: "Failed to delete account" };
  }
}
