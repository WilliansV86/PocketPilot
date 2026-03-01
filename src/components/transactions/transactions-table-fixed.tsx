"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Edit, Trash, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/actions/transaction-actions";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  date: Date;
  account?: {
    id: string;
    name: string;
  } | null;
  toAccount?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const result = await deleteTransaction(id);
      
      if (result.success) {
        toast.success("Transaction deleted successfully");
        // Force a full page redirect to ensure fresh data
        setTimeout(() => {
          window.location.href = "/transactions";
        }, 1000);
      } else {
        toast.error(result.error || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete transaction");
    } finally {
      setIsDeleting(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "INCOME":
        return <TrendingUp className="h-3 w-3" />;
      case "EXPENSE":
        return <TrendingDown className="h-3 w-3" />;
      case "TRANSFER":
        return <ArrowRightLeft className="h-3 w-3" />;
      default:
        return <TrendingUp className="h-3 w-3" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "INCOME":
        return "text-green-600 dark:text-green-400";
      case "EXPENSE":
        return "text-red-600 dark:text-red-400";
      case "TRANSFER":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getTransactionBgColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "INCOME":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "EXPENSE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "TRANSFER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getAccountDisplay = (transaction: Transaction) => {
    if (transaction.type === "TRANSFER" && transaction.toAccount) {
      const fromName = transaction.account?.name || "Unknown Account";
      const toName = transaction.toAccount?.name || "Unknown Account";
      return `${fromName} → ${toName}`;
    }
    return transaction.account?.name || "Unknown Account";
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return format(dateObj, "MMM dd, yyyy");
    } catch (error) {
      return "Date Error";
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="text-lg font-medium mb-2">No transactions found</div>
        <p className="text-muted-foreground">
          Try adjusting your filters or add your first transaction
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
            <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr 
              key={transaction.id} 
              className="border-b transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3 text-sm">
                {formatDate(transaction.date)}
              </td>
              <td className="px-4 py-3 text-sm font-medium">
                {transaction.description}
              </td>
              <td className="px-4 py-3 text-sm">
                {getAccountDisplay(transaction)}
              </td>
              <td className="px-4 py-3 text-sm">
                {transaction.category ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <span>{transaction.category.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No category</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${getTransactionBgColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </span>
                  <span>{transaction.type}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold">
                <span className={getTransactionColor(transaction.type)}>
                  {transaction.type === "INCOME" ? "+" : transaction.type === "EXPENSE" ? "-" : ""}
                  ${transaction.amount.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center justify-center gap-1">
                  <Link href={`/transactions/${transaction.id}/edit`}>
                    <button
                      className="p-1 hover:bg-muted rounded text-xs"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    disabled={isDeleting === transaction.id}
                    className="p-1 hover:bg-muted rounded text-xs text-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting === transaction.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent" />
                    ) : (
                      <Trash className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
