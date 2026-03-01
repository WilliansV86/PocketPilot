"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/actions/transaction-actions";
import { TransactionsTable } from "@/components/transactions/transactions-table-fixed";
import { MobileTransactionsTable } from "@/components/transactions/mobile-transactions-table";
import { SimpleMonthFilter } from "@/components/transactions/simple-month-filter";
import { ClearButton } from "@/components/transactions/clear-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function TransactionsPageWithFilter() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get month from URL params
  const monthFilter = searchParams.get("month");
  
  // Fetch transactions when month filter changes
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        console.log('=== CLIENT SIDE FETCH ===');
        console.log('Month filter from URL:', monthFilter);
        
        const result = await getTransactions(monthFilter || undefined);
        
        if (result && result.success) {
          setTransactions(result.data || []);
          setError(null);
        } else {
          setError(result?.error || "Failed to load transactions");
          setTransactions([]);
        }
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError("An unexpected error occurred while loading transactions");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [monthFilter]);
  
  // Format current month for default value in filter
  const currentMonthFilter = format(new Date(), "yyyy-MM");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button asChild>
          <Link href="/transactions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Link>
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <SimpleMonthFilter defaultValue={monthFilter || ""} />
        {monthFilter && <ClearButton href="/transactions" children="Clear Filter" />}
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading transactions...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <MobileTransactionsTable transactions={transactions} />
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:block">
            <TransactionsTable transactions={transactions} />
          </div>
        </div>
      )}
    </div>
  );
}
