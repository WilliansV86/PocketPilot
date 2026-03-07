"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TransactionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { smartRevalidate } from "@/lib/actions/performance-actions";

// Type for Prisma transaction client
type PrismaTransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Helper function to update account balance
async function updateAccountBalance(
  prismaClient: PrismaTransactionClient,
  accountId: string, 
  amount: number | Prisma.Decimal
) {
  const account = await prismaClient.financialAccount.findUnique({
    where: { id: accountId },
  });
  
  if (account) {
    // Convert Decimal to number if needed
    const amountToAdd = amount instanceof Prisma.Decimal 
      ? parseFloat(amount.toString()) 
      : amount;
      
    await prismaClient.financialAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: amountToAdd,
        },
      },
    });
  }
}

// Optimized delete transaction without full page refresh
export async function deleteTransactionOptimized(id: string) {
  try {
    // Get the default user
    const user = await getDefaultUser();
    
    // Get the transaction details before deletion
    const transaction = await prisma.transaction.findUnique({
      where: { 
        id,
      },
      select: { 
        amount: true, 
        accountId: true, 
        type: true,
        toAccountId: true,
        userId: true,
        date: true,
        categoryId: true
      },
    });
    
    if (!transaction || transaction.userId !== user.id) {
      return { success: false, error: "Transaction not found" };
    }
    
    // Start a transaction to ensure all database operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete the transaction first
      await tx.transaction.delete({
        where: { id },
      });
      
      // Then update the account balances based on transaction type
      if (transaction.type === TransactionType.INCOME) {
        // For income reversal, decrease the account balance
        await updateAccountBalance(tx, transaction.accountId, -transaction.amount);
      } 
      else if (transaction.type === TransactionType.EXPENSE) {
        // For expense reversal, increase the account balance
        await updateAccountBalance(tx, transaction.accountId, transaction.amount);
      } 
      else if (transaction.type === TransactionType.TRANSFER) {
        // For transfers, reverse both sides of the transaction
        await updateAccountBalance(tx, transaction.accountId, transaction.amount);
        
        // If there is a destination account, reverse the effect there too
        if (transaction.toAccountId) {
          await updateAccountBalance(tx, transaction.toAccountId, -transaction.amount);
        }
      }
    });
    
    // Use smart revalidation instead of full page refresh
    await smartRevalidate('transaction', 'delete');
    
    return { 
      success: true, 
      deletedTransaction: {
        id,
        type: transaction.type,
        amount: transaction.amount,
        accountId: transaction.accountId,
        toAccountId: transaction.toAccountId,
        date: transaction.date,
        categoryId: transaction.categoryId
      }
    };
  } catch (error) {
    console.error(`Failed to delete transaction ${id}:`, error);
    return { success: false, error: "Failed to delete transaction" };
  }
}
