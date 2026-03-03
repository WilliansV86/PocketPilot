"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Edit, 
  MoreHorizontal, 
  Trash,
  RefreshCw,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyStateV2 } from "@/components/ui/empty-state-v2";
import { TransactionAmount } from "@/components/transactions/transaction-amount";
import { deleteTransaction } from "@/lib/actions/transaction-actions";
import { deleteTransactionOptimized } from "@/lib/actions/transaction-actions-optimized";
import { formatCurrency, getAmountColorClass, getTransactionIcon } from "@/lib/format";
import { getFinancialTypeColor, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { TYPOGRAPHY, COMPONENTS, COLORS, ANIMATIONS } from "@/lib/theme/tokens";
import { toast } from "sonner";
import { safeServerAction } from "@/lib/client-actions";

// Transaction type definition matching our schema
type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: string; // INCOME, EXPENSE, TRANSFER
  notes?: string | null;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  account: {
    name: string;
    currency: string;
  };
  toAccount?: {
    name: string;
    currency: string;
  } | null;
  category?: {
    name: string;
    group: string;
  } | null;
};

type TransactionsTableProps = {
  transactions: Transaction[];
};

// Helper function to get transaction icon component
function getTransactionIconComponent(type: string) {
  try {
    switch (type?.toUpperCase()) {
      case 'INCOME':
        return <TrendingUp className="h-3 w-3" />;
      case 'EXPENSE':
        return <TrendingDown className="h-3 w-3" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="h-3 w-3" />;
      default:
        return <Receipt className="h-3 w-3" />;
    }
  } catch (error) {
    console.error('Icon component error:', error, type);
    return <Receipt className="h-3 w-3" />;
  }
}

// Helper function to get transaction color class
function getTransactionColorClass(type: string): string {
  try {
    switch (type?.toUpperCase()) {
      case 'INCOME':
        return COLORS.CURRENCY.INCOME;
      case 'EXPENSE':
        return COLORS.CURRENCY.EXPENSE;
      case 'TRANSFER':
        return COLORS.CURRENCY.TRANSFER;
      default:
        return COLORS.CURRENCY.NEUTRAL;
    }
  } catch (error) {
    console.error('Color class error:', error, type);
    return COLORS.CURRENCY.NEUTRAL;
  }
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [transactionsList, setTransactionsList] = useState(transactions);

  // Update the local state when transactions prop changes
  useEffect(() => {
    // Filter out any transactions that were "deleted" in preview mode
    const deletedIds = JSON.parse(localStorage.getItem('deletedTransactions') || '[]');
    const filteredTransactions = transactions.filter(t => !deletedIds.includes(t.id));
    setTransactionsList(filteredTransactions);
  }, [transactions]);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      
      // Show immediate feedback
      toast.loading("Deleting transaction...");
      
      // Use optimized delete action
      const result = await safeServerAction(
        () => deleteTransactionOptimized(id),
        // Fallback function for browser preview - persist deletion in localStorage
        async () => {
          // For browser preview, store the deleted ID in localStorage
          const deletedIds = JSON.parse(localStorage.getItem('deletedTransactions') || '[]');
          if (!deletedIds.includes(id)) {
            deletedIds.push(id);
            localStorage.setItem('deletedTransactions', JSON.stringify(deletedIds));
          }
          return { success: true, isPreview: true } as any;
        }
      );
      
      if (result.success) {
        if ((result as any).isPreview) {
          // Remove from local state immediately for preview mode
          setTransactionsList(prev => prev.filter(t => t.id !== id));
          toast.success("Transaction removed from view (preview mode). Use localhost:3000 for actual deletion.", {
            duration: 4000
          });
        } else {
          // Remove from local state immediately - no page refresh needed
          setTransactionsList(prev => prev.filter(t => t.id !== id));
          toast.success("Transaction deleted successfully");
          
          // Clear localStorage when actual deletion succeeds
          const deletedIds = JSON.parse(localStorage.getItem('deletedTransactions') || '[]');
          const updatedIds = deletedIds.filter((deletedId: string) => deletedId !== id);
          localStorage.setItem('deletedTransactions', JSON.stringify(updatedIds));
        }
      } else {
        toast.error((result as any)?.error || "Failed to delete transaction");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  // Function to determine the CSS class for amount color based on transaction type
  const getAmountColorClass = (transaction: Transaction) => {
    if (transaction.type === "EXPENSE") {
      return "text-red-600";
    } else if (transaction.type === "INCOME") {
      return "text-green-600";
    }
    return "text-blue-600"; // Transfer
  };
  
  // Function to get display account info for transfers
  const getAccountDisplay = (transaction: Transaction) => {
    try {
      if (transaction.type === "TRANSFER" && transaction.toAccount) {
        const fromName = transaction.account?.name || 'Unknown Account';
        const toName = transaction.toAccount?.name || 'Unknown Account';
        return `${fromName} → ${toName}`;
      }
      return transaction.account?.name || 'Unknown Account';
    } catch (error) {
      console.error('Account display error:', error, transaction);
      return 'Account Error';
    }
  };

  if (transactionsList.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No transactions found</h3>
        <p className="text-muted-foreground">
          No transactions yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactionsList.map((transaction, index) => (
            <tr key={transaction.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 text-sm">
                {(() => {
                  try {
                    const date = new Date(transaction.date);
                    if (isNaN(date.getTime())) {
                      return 'Invalid Date';
                    }
                    return format(date, "MMM dd, yyyy");
                  } catch (error) {
                    console.error('Date formatting error:', error, transaction.date);
                    return 'Date Error';
                  }
                })()}
              </td>
              <td className="px-4 py-3 text-sm">{transaction.description}</td>
              <td className="px-4 py-3 text-sm">{getAccountDisplay(transaction)}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getTransactionColorClass(transaction.type)}`}>
                    {getTransactionIconComponent(transaction.type)}
                  </span>
                  {transaction.type}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold">
                <TransactionAmount 
                  amount={transaction.amount}
                  type={transaction.type}
                  size="sm"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
