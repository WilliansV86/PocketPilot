"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Edit, 
  MoreHorizontal, 
  Trash,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Tag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionAmount } from "@/components/transactions/transaction-amount";
import { deleteTransactionOptimized } from "@/lib/actions/transaction-actions-optimized";
import { formatCurrency, getAmountColorClass, getTransactionIcon } from "@/lib/format";
import { getFinancialTypeColor, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { toast } from "sonner";
import { safeServerAction } from "@/lib/client-actions";

// Transaction type definition matching our schema
type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: string; // INCOME, EXPENSE, TRANSFER
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  account?: {
    id: string;
    name: string;
  } | null;
  toAccount?: {
    id: string;
    name: string;
  } | null;
  notes?: string | null;
};

interface TransactionsTableProps {
  transactions: Transaction[];
}

// Function to get transaction color class
const getTransactionColorClass = (type: string) => {
  try {
    switch (type) {
      case 'INCOME':
        return 'bg-green-100 text-green-800';
      case 'EXPENSE':
        return 'bg-red-100 text-red-800';
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  } catch (error) {
    console.error('Color class error:', error, type);
    return 'bg-gray-100 text-gray-800';
  }
};

// Function to get transaction icon component
const getTransactionIconComponent = (type: string) => {
  try {
    switch (type) {
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
};

export function MobileTransactionsTable({ transactions }: TransactionsTableProps) {
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
            duration: 3000,
          });
        } else {
          toast.success("Transaction deleted successfully");
        }
      } else {
        toast.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("An error occurred while deleting the transaction");
    } finally {
      setIsDeleting(null);
    }
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
      <EmptyState
        icon="🧾"
        title="No transactions found"
        description="No transactions yet"
      />
    );
  }

  return (
    <div className="space-y-3">
      {transactionsList.map((transaction) => (
        <Card key={transaction.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header Row - Date, Amount, Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
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
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold">
                    <TransactionAmount 
                      amount={transaction.amount}
                      type={transaction.type}
                      size="lg"
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isDeleting === transaction.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/transactions/${transaction.id}/edit`} className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 focus:text-red-600"
                        disabled={isDeleting === transaction.id}
                      >
                        <Trash className="h-4 w-4" />
                        {isDeleting === transaction.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Description Row */}
              <div>
                <h3 className="font-medium text-base leading-tight">
                  {transaction.description}
                </h3>
                {transaction.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {transaction.notes}
                  </p>
                )}
              </div>

              {/* Meta Information Row */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* Type Badge */}
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${getTransactionColorClass(transaction.type)}`}>
                    {getTransactionIconComponent(transaction.type)}
                  </span>
                  <span className="text-xs font-medium">{transaction.type}</span>
                </div>

                {/* Account */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-xs">{getAccountDisplay(transaction)}</span>
                </div>

                {/* Category */}
                {transaction.category && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {transaction.category.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress indicator for budget tracking (optional) */}
              {transaction.category && transaction.type === 'EXPENSE' && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Category spending</span>
                    <span>This month</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
