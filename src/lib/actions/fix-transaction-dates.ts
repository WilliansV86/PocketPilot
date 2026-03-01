"use server";

import { prisma } from "@/lib/db";

// Fix old transactions with wrong UTC dates
export async function fixTransactionDates() {
  try {
    console.log('=== FIXING TRANSACTION DATES ===');
    
    // Get all transactions and check their dates
    const allTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        description: true,
        date: true,
      }
    });
    
    // Filter transactions that have midnight UTC time (wrong dates)
    const wrongTransactions = allTransactions.filter(transaction => {
      const dateStr = transaction.date.toISOString();
      return dateStr.includes("T00:00:00.000Z");
    });
    
    console.log(`Found ${wrongTransactions.length} transactions with wrong dates`);
    
    for (const transaction of wrongTransactions) {
      // Extract the original date string (before UTC conversion)
      const originalDate = transaction.date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Create the correct UTC date (noon instead of midnight)
      const [year, month, day] = originalDate.split('-').map(Number);
      const correctDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      
      console.log(`Fixing transaction: ${transaction.description}`);
      console.log(`  Old date: ${transaction.date.toISOString()} (${transaction.date.toDateString()})`);
      console.log(`  New date: ${correctDate.toISOString()} (${correctDate.toDateString()})`);
      
      // Update the transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { date: correctDate }
      });
    }
    
    console.log('=== TRANSACTION DATES FIXED ===');
    
    return { success: true, message: `Fixed ${wrongTransactions.length} transactions` };
  } catch (error) {
    console.error("Error fixing transaction dates:", error);
    return { success: false, error: "Failed to fix transaction dates" };
  }
}
