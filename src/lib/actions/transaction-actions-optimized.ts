"use server";
import { deleteTransaction } from "@/lib/actions/transaction-actions";
// Both desktop and mobile use one atomic balance-reversal implementation.
export async function deleteTransactionOptimized(id: string) { return deleteTransaction(id); }
