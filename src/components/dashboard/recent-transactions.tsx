"use client";

import { format } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TransactionAmount } from "@/components/transactions/transaction-amount";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: string; // INCOME, EXPENSE, TRANSFER
  date: Date;
  account: {
    name: string;
    currency: string;
  };
  category?: {
    name: string;
    type: string;
  } | null;
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Function to determine the CSS class for amount color
  const getAmountColorClass = (amount: number) => {
    return amount < 0 ? "text-red-500" : amount > 0 ? "text-green-500" : "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your most recent financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent transactions found.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), "MMM d, yyyy")} • {transaction.account.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category?.name || "Uncategorized"}
                  </p>
                </div>
                <TransactionAmount 
                  amount={transaction.amount}
                  type={transaction.type}
                  size="sm"
                  animated={false}
                />
              </div>
            ))}
            <div className="mt-4 text-center">
              <Link 
                href="/transactions" 
                className="text-sm text-primary hover:underline"
              >
                View All Transactions
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
