"use client";
import { useLanguage } from "@/components/language-provider";

import { I18nText } from "@/components/language-provider";



import { useState, useEffect, useRef } from "react";
import { ActionMenuButton } from "@/components/ui/action-menu-button";
import Link from "next/link";
import { 
  Edit, 
  Trash,
  Wallet, CreditCard, PiggyBank, TrendingUp, Banknote, ArrowLeftRight, Home
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
import { formatMoney } from "@/lib/currency";
import { getAmountColorClass, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { safeServerAction } from "@/lib/client-actions";
import { PATTERNS, TYPOGRAPHY, BUTTON } from "@/lib/ui-constants";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

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
 const { t: ppT } = useLanguage();

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
          <p className="font-medium">{""}<I18nText text={"Error loading accounts"}/>{""}</p>
          <p className="text-sm"><I18nText text={error}/></p>
        </div>
      </div>
    );
  }

  if ((accountsList || []).length === 0) {
    return (
      <EmptyState
        icon="🏦"
        title={ppT("No accounts yet")}
        description="Create your first account to start tracking your finances"
        action={{
          label: "Create Account",
          onClick: () => window.location.href = "/accounts/new"
        }}
      />
    );
  }

  const preferredOrder = ["CHECKING", "SAVINGS", "INVESTMENT", "CASH", "CREDIT", "LOAN", "OTHER"];
  const groups = Array.from(new Set(accountsList.map(account => account.type))).sort((a, b) => {
    const rank = (type: string) => preferredOrder.includes(type) ? preferredOrder.indexOf(type) : preferredOrder.length;
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const labels: Record<string, string> = { CHECKING: "Checking accounts", SAVINGS: "Savings accounts", INVESTMENT: "Investments", CASH: "Cash", CREDIT: "Credit accounts", LOAN: "Loan accounts", OTHER: "Other accounts" };

  const styles: Record<string, { icon: typeof Wallet; color: string; tint: string; border: string }> = {
    CHECKING: { icon: CreditCard, color: "text-blue-700 dark:text-blue-400", tint: "bg-blue-500/10", border: "border-t-blue-500" },
    SAVINGS: { icon: PiggyBank, color: "text-emerald-700 dark:text-emerald-400", tint: "bg-emerald-500/10", border: "border-t-emerald-500" },
    INVESTMENT: { icon: TrendingUp, color: "text-indigo-700 dark:text-indigo-400", tint: "bg-indigo-500/10", border: "border-t-indigo-500" },
    CASH: { icon: Banknote, color: "text-orange-700 dark:text-orange-400", tint: "bg-orange-500/10", border: "border-t-orange-500" },
    CREDIT: { icon: CreditCard, color: "text-violet-700 dark:text-violet-400", tint: "bg-violet-500/10", border: "border-t-violet-500" },
    CREDIT_CARD: { icon: CreditCard, color: "text-violet-700 dark:text-violet-400", tint: "bg-violet-500/10", border: "border-t-violet-500" },
    LOAN: { icon: ArrowLeftRight, color: "text-rose-700 dark:text-rose-400", tint: "bg-rose-500/10", border: "border-t-rose-500" },
    MORTGAGE: { icon: Home, color: "text-amber-700 dark:text-amber-400", tint: "bg-amber-500/10", border: "border-t-amber-500" }
  };
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      {groups.map(type => {
        const groupAccounts = accountsList.filter(account => account.type === type);
        const currencies = Array.from(new Set(groupAccounts.map(account => account.currency || "USD"))).sort();
        const style = styles[type] || { icon: Wallet, color: "text-muted-foreground", tint: "bg-muted", border: "border-t-muted-foreground" };
        const Icon = style.icon;
        return (
          <section key={type} className={`min-w-0 overflow-hidden rounded-xl border border-t-2 bg-card shadow-sm ${style.border}`} aria-label={labels[type] || formatAccountType(type)}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${style.tint}`}>
              <div className="flex items-center gap-3">
                <span className={`flex size-9 items-center justify-center rounded-xl ${style.tint} ${style.color}`}><Icon className="size-5" /></span>
                <div><h2 className="text-lg font-semibold tracking-tight">{labels[type] || formatAccountType(type)}</h2>
                <div className="text-xs text-muted-foreground">{groupAccounts.length} <I18nText text={groupAccounts.length === 1 ? "account" : "accounts"}/></div></div>
              </div>
              <div className="space-y-0.5 text-right">
                <div className="text-xs font-normal text-muted-foreground">{""}<I18nText text={"Total balance"}/>{""}</div>
                <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">{currencies.map(currency => <div key={currency} className="text-base font-semibold">{formatMoney(groupAccounts.filter(account => (account.currency || "USD") === currency).reduce((sum, account) => sum + Number(account.balance), 0), currency)}</div>)}</div>
              </div>
            </div>
            <div className="divide-y md:hidden">
              {groupAccounts.map(account => <article key={account.id} aria-label={account.name} className="min-w-0 space-y-2 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-base font-medium">{account.name}</h3><p className="mt-1 text-xs text-muted-foreground">{account.currency || "USD"}</p></div>
                  <DropdownMenu><DropdownMenuTrigger asChild><ActionMenuButton label={`Actions for ${account.name}`} disabled={isDeleting===account.id} /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/accounts/${account.id}/edit`}><Edit className="mr-2 h-4 w-4" />{""}<I18nText text={"Edit account"}/>{""}</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled={isDeleting===account.id} className="text-destructive" onClick={()=>handleDelete(account.id)}><Trash className="mr-2 h-4 w-4" />{""}<I18nText text={"Delete account"}/>{""}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-2"><span className="text-xs text-muted-foreground">{""}<I18nText text={"Balance"}/>{""}</span><span className="break-words text-lg font-semibold tabular-nums">{formatMoney(account.balance,account.currency)}</span></div>
              </article>)}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader><TableRow><TableHead>{""}<I18nText text={"Account"}/>{""}</TableHead><TableHead className="text-right">{""}<I18nText text={"Balance"}/>{""}</TableHead><TableHead className="w-10"><span className="sr-only">{""}<I18nText text={"Actions"}/>{""}</span></TableHead></TableRow></TableHeader>
                <TableBody>
                  {groupAccounts.map(account => (
            <TableRow key={account.id} className={`${PATTERNS.TABLE_ROW} ${FINANCIAL_ANIMATIONS.CARD_ELEVATION}`}>
              <TableCell className="px-4 py-3"><div className="text-base font-medium">{account.name}</div><div className="mt-1"><AccountTypeBadge type={account.type} size="sm" /></div></TableCell>
              <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                <AnimatedBalance 
                  amount={account.balance}
                  currency={account.currency}
                  size="md"
                  animated={true}
                />
              </TableCell>
              <TableCell className="w-10 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ActionMenuButton label={`Actions for ${account.name}`} disabled={isDeleting===account.id} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className={TYPOGRAPHY.STATUS}>{""}<I18nText text={"Actions"}/>{""}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/accounts/${account.id}/edit`} className={BUTTON.ICON_SPACING}>
                        <Edit className="h-4 w-4" />{" "}<I18nText text={"Edit"}/>{" "}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(account.id)}
                      disabled={isDeleting === account.id}
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    >
                      <Trash className={`mr-2 h-4 w-4`} />{" "}<I18nText text={"Delete"}/>{" "}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Helper function to format account types for display
function formatAccountType(type: string): string {
  // The new schema uses simple upper case strings without underscores
  return type.charAt(0) + type.slice(1).toLowerCase();
}
