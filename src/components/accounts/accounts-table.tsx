"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Edit, 
  MoreHorizontal, 
  Trash,
  Wallet
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
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedBalance } from "@/components/ui/animated-balance";
import { AccountTypeBadge } from "@/components/accounts/account-type-badge";
import { getAccounts, deleteAccount } from "@/lib/actions/account-actions";
import { formatCurrency } from "@/lib/format";
import { getAmountColorClass, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { safeServerAction } from "@/lib/client-actions";
import { PATTERNS, TYPOGRAPHY, BUTTON } from "@/lib/ui-constants";
import { toast } from "sonner";

// Account type definition from our updated schema
type FinancialAccount = {
  id: string;
  name: string;
  type: string; // Now using "CHECKING", "SAVINGS", "CREDIT", etc.
  balance: number;
  currency: string;
};

type AccountsTableProps = {
  accounts?: FinancialAccount[];
};

export function AccountsTable({ accounts = [] }: AccountsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [accountsList, setAccountsList] = useState(accounts || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousAccountsRef = useRef(accounts);

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getAccounts();
        
        if (!result.success) {
          throw new Error('Failed to fetch accounts');
        }
        
        setAccountsList(result.data || []);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Update the local state when accounts prop changes
  useEffect(() => {
    // Only update if the accounts prop actually changed
    if (JSON.stringify(previousAccountsRef.current) !== JSON.stringify(accounts)) {
      // Filter out any accounts that were "deleted" in preview mode
      const deletedIds = JSON.parse(localStorage.getItem('deletedAccounts') || '[]');
      const filteredAccounts = (accounts || []).filter(a => !deletedIds.includes(a.id));
      
      // Apply any updates from localStorage
      const updatedAccounts = JSON.parse(localStorage.getItem('updatedAccounts') || '{}');
      const finalAccounts = filteredAccounts.map(account => {
        if (updatedAccounts[account.id]) {
          return updatedAccounts[account.id];
        }
        return account;
      });
      
      // Add any new accounts created in preview mode
      const newAccounts = JSON.parse(localStorage.getItem('newAccounts') || '[]');
      const allAccounts = [...finalAccounts, ...newAccounts];
      
      setAccountsList(allAccounts);
      previousAccountsRef.current = accounts;
    }
  }, [accounts]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    
    try {
      toast.loading("Deleting account...");
      
      const result = await safeServerAction(
        () => deleteAccount(id),
        // Fallback function for browser preview - persist deletion in localStorage
        async () => {
          // For browser preview, store the deleted ID in localStorage
          const deletedIds = JSON.parse(localStorage.getItem('deletedAccounts') || '[]');
          if (!deletedIds.includes(id)) {
            deletedIds.push(id);
            localStorage.setItem('deletedAccounts', JSON.stringify(deletedIds));
          }
          return { success: true, message: "Account removed from view (preview mode)" };
        }
      );
      
      if (result.success) {
        if (result.message?.includes("preview mode")) {
          // Remove from local state immediately for preview mode
          setAccountsList(prev => (prev || []).filter(a => a.id !== id));
          toast.success(result.message);
          // Remove from UI immediately
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.success(result.message || "Account deleted successfully");
          // Clear localStorage when actual deletion succeeds
          const deletedIds = JSON.parse(localStorage.getItem('deletedAccounts') || '[]');
          const updatedIds = deletedIds.filter((deletedId: string) => deletedId !== id);
          localStorage.setItem('deletedAccounts', JSON.stringify(updatedIds));
          window.location.reload();
        }
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error(error.message || "Failed to delete account");
    }
    
    setIsDeleting(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-500 text-center">
          <p className="font-medium">Error loading accounts</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if ((accountsList || []).length === 0) {
    return (
      <EmptyState
        icon="🏦"
        title="No accounts yet"
        description="Create your first account to start tracking your finances"
        action={{
          label: "Create Account",
          onClick: () => window.location.href = "/accounts/new"
        }}
      />
    );
  }

  return (
    <div className={PATTERNS.TABLE_SCROLL_CONTAINER}>
      <Table>
        <TableHeader className={PATTERNS.TABLE_HEADER}>
          <TableRow>
            <TableHead className={TYPOGRAPHY.LABEL}>Name</TableHead>
            <TableHead className={TYPOGRAPHY.LABEL}>Type</TableHead>
            <TableHead className={`text-right ${TYPOGRAPHY.LABEL}`}>Balance</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(accountsList || []).map((account) => (
            <TableRow key={account.id} className={`${PATTERNS.TABLE_ROW} ${FINANCIAL_ANIMATIONS.CARD_ELEVATION}`}>
              <TableCell className={TYPOGRAPHY.BODY_LARGE}>{account.name}</TableCell>
              <TableCell className={TYPOGRAPHY.BODY}>
                <AccountTypeBadge 
                  type={account.type} 
                  size="sm" 
                  variant="default"
                />
              </TableCell>
              <TableCell className={`text-right ${TYPOGRAPHY.AMOUNT_MEDIUM}`}>
                <AnimatedBalance 
                  amount={account.balance}
                  size="md"
                  animated={true}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={BUTTON.ICON_ONLY}>
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className={TYPOGRAPHY.STATUS}>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/accounts/${account.id}/edit`} className={BUTTON.ICON_SPACING}>
                        <Edit className="h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(account.id)}
                      disabled={isDeleting === account.id}
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    >
                      <Trash className={`mr-2 h-4 w-4`} />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper function to format account types for display
function formatAccountType(type: string): string {
  // The new schema uses simple upper case strings without underscores
  return type.charAt(0) + type.slice(1).toLowerCase();
}
