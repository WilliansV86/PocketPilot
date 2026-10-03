"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { TransactionType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction, updateTransaction } from "@/lib/actions/transaction-actions";
import { toast } from "sonner";

// Define the form validation schema
const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required").refine(val => Number.isFinite(Number(val)) && Number(val) > 0, "Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  type: z.nativeEnum(TransactionType),
  accountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
};

type Category = {
  id: string;
  name: string;
  group: string;
  color?: string;
  icon?: string;
  isArchived?: boolean;
};

type TransactionFormProps = {
  transaction?: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: TransactionType;
    accountId: string | null;
    creditCardId?: string | null;
    toAccountId?: string | null;
    categoryId?: string | null;
    notes?: string | null;
  };
  accounts: Account[];
  creditCards?: { id: string; name: string; currency: string }[];
  categories: Category[];
  mode: "create" | "edit";
};

export function TransactionForm({ transaction, accounts, creditCards = [], categories, mode }: TransactionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Merge localStorage accounts with server accounts
  const [mergedAccounts, setMergedAccounts] = useState<Account[]>(accounts);
  
  useEffect(() => {
    const mergeAccountData = () => {
      // Get localStorage changes
      const deletedIds = JSON.parse(localStorage.getItem('deletedAccounts') || '[]');
      const updatedAccounts = JSON.parse(localStorage.getItem('updatedAccounts') || '{}');
      const newAccounts = JSON.parse(localStorage.getItem('newAccounts') || '[]');
      
      // Filter out deleted accounts
      const filteredAccounts = accounts.filter(a => !deletedIds.includes(a.id));
      
      // Apply updates
      const finalAccounts = filteredAccounts.map(account => {
        if (updatedAccounts[account.id]) {
          return updatedAccounts[account.id];
        }
        return account;
      });
      
      // Add new accounts
      const allAccounts = [...finalAccounts, ...newAccounts];
      
      setMergedAccounts(allAccounts);
    };
    
    mergeAccountData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      mergeAccountData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [accounts]);
  
  // State to track the selected transaction type
  const [selectedType, setSelectedType] = useState<TransactionType>(
    transaction?.type || TransactionType.EXPENSE
  );

  // State to handle conditional display of toAccount field
  const [showToAccount, setShowToAccount] = useState(
    selectedType === TransactionType.TRANSFER
  );

  // Filter categories based on transaction type
  const relevantCategories = categories.filter(cat => {
    if (selectedType === TransactionType.INCOME) {
      return cat.group === "INCOME";
    } else if (selectedType === TransactionType.EXPENSE) {
      return ["NEEDS", "WANTS", "DEBT", "OTHER"].includes(cat.group);
    } else {
      // For transfers, we may use "OTHER" category or no category
      return cat.group === "OTHER";
    }
  });

  // Default values for the form
  const defaultValues: FormValues = transaction
    ? {
        description: transaction.description,
        amount: transaction.amount.toString(),
        date: format(new Date(transaction.date), "yyyy-MM-dd"),
        type: transaction.type,
        accountId: transaction.creditCardId ? `card:${transaction.creditCardId}` : transaction.accountId || "",
        toAccountId: transaction.toAccountId || "",
        categoryId: transaction?.categoryId ? transaction.categoryId : "__none__",
        notes: transaction.notes || "",
      }
    : {
        description: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: TransactionType.EXPENSE,
        accountId: mergedAccounts && mergedAccounts.length > 0 ? mergedAccounts[0].id : creditCards[0] ? `card:${creditCards[0].id}` : "",
        toAccountId: "",
        categoryId: "__none__",
        notes: "",
      };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Watch for transaction type changes to show/hide the toAccount field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type" && value.type) {
        setSelectedType(value.type as TransactionType);
        setShowToAccount(value.type === TransactionType.TRANSFER);
        if (value.type !== TransactionType.EXPENSE && form.getValues("accountId").startsWith("card:")) form.setValue("accountId", accounts[0]?.id || "");
        form.setValue("categoryId", "__none__");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("description", values.description);
        formData.append("amount", values.amount.toString());
        formData.append("date", values.date);
        formData.append("type", values.type);
        formData.append("accountId", values.accountId);
        
        // Only include toAccountId for transfers
        if (values.type === TransactionType.TRANSFER && values.toAccountId) {
          formData.append("toAccountId", values.toAccountId);
        }
        
        if (values.categoryId && values.categoryId !== "__none__") formData.append("categoryId", values.categoryId);
        if (values.notes) formData.append("notes", values.notes);

        if (mode === "create") {
          const result = await createTransaction(formData);
          if (result.success) {
            toast.success("Transaction created successfully");
            // Navigate back to transactions list
            router.push("/transactions");
            router.refresh();
          } else {
            toast.error(result.error || "Failed to create transaction");
          }
        } else if (mode === "edit" && transaction) {
          const result = await updateTransaction(transaction.id, formData);
          if (result.success) {
            toast.success("Transaction updated successfully");
            // Navigate back to transactions list
            router.push("/transactions");
            router.refresh();
          } else {
            toast.error(result.error || "Failed to update transaction");
          }
        }
      } catch (error) {
        console.error("Failed to save transaction:", error);
        toast.error("Failed to save transaction");
      }
    });
  };

  const source = form.watch("accountId");
  const sources = selectedType === TransactionType.EXPENSE ? creditCards : [];
  const selectedCard = creditCards.find(card => `card:${card.id}` === source);
  const unavailableCard = transaction?.creditCardId && !creditCards.some(card => card.id === transaction.creditCardId);
  if (accounts.length === 0 && creditCards.length === 0 && !transaction) return <div className="py-8 text-center">
    <p className="mb-4 text-muted-foreground">Add a bank account or an open credit card before recording a transaction.</p>
    <Button type="button" onClick={() => router.push("/accounts/new")}>Add account</Button>
    <Button type="button" variant="outline" className="ml-2" onClick={() => router.push("/debts/new")}>Add credit card</Button>
  </div>;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Transaction Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                  <SelectItem value={TransactionType.TRANSFER}>Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Grocery Shopping" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{selectedType === TransactionType.TRANSFER ? "From Account" : selectedType === TransactionType.EXPENSE ? "Paid with" : "Account"}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Accounts</div>
                    {mergedAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </SelectItem>
                    ))}
                    {sources.length > 0 && <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Credit cards</div>}
                    {sources.map(card => <SelectItem key={card.id} value={`card:${card.id}`}>{card.name} ({card.currency}) · Credit card</SelectItem>)}
                    {unavailableCard && selectedType === TransactionType.EXPENSE && <SelectItem value={`card:${transaction!.creditCardId}`} disabled>Previous card (closed) — choose an open payment source</SelectItem>}
                  </SelectContent>
                </Select>
                {selectedCard && <FormDescription>This purchase adds to {selectedCard.name}'s debt balance in {selectedCard.currency} and counts toward your category budget.</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* To Account field - only shown for transfers */}
          {showToAccount && (
            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mergedAccounts
                        .filter(account => account.id !== form.getValues().accountId)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.currency})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Only show category if not a transfer */}
          {!showToAccount && (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Uncategorized</SelectItem>
                      {relevantCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional details here" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create Transaction" : "Update Transaction"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/transactions")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
