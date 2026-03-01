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
  amount: z.string().min(1, "Amount is required").refine(val => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
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
};

type Category = {
  id: string;
  name: string;
  group: string;
};

type TransactionFormProps = {
  transaction?: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: TransactionType;
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    notes?: string | null;
  };
  accounts: Account[];
  categories: Category[];
  mode: "create" | "edit";
};

export function TransactionForm({ transaction, accounts, categories, mode }: TransactionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
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
      return ["NEEDS", "WANTS", "DEBT"].includes(cat.group);
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
        accountId: transaction.accountId,
        toAccountId: transaction.toAccountId || "",
        categoryId: transaction.categoryId || "",
        notes: transaction.notes || "",
      }
    : {
        description: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: TransactionType.EXPENSE,
        accountId: accounts.length > 0 ? accounts[0].id : "",
        toAccountId: "",
        categoryId: "",
        notes: "",
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Watch for transaction type changes to show/hide the toAccount field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type" && value.type) {
        setSelectedType(value.type as TransactionType);
        setShowToAccount(value.type === TransactionType.TRANSFER);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("description", values.description);
        formData.append("amount", Number(values.amount).toString());
        formData.append("date", values.date);
        formData.append("type", values.type);
        formData.append("accountId", values.accountId);
        
        // Only include toAccountId for transfers
        if (values.type === TransactionType.TRANSFER && values.toAccountId) {
          formData.append("toAccountId", values.toAccountId);
        }
        
        if (values.categoryId) formData.append("categoryId", values.categoryId);
        if (values.notes) formData.append("notes", values.notes);

        if (mode === "create") {
          await createTransaction(formData);
          toast.success("Transaction created successfully");
        } else if (mode === "edit" && transaction) {
          await updateTransaction(transaction.id, formData);
          toast.success("Transaction updated successfully");
        }
        
        // Navigate back to transactions list
        router.push("/transactions");
        router.refresh();
      } catch (error) {
        console.error("Failed to save transaction:", error);
        toast.error("Failed to save transaction");
      }
    });
  };


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
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                <FormLabel>{selectedType === TransactionType.TRANSFER ? "From Account" : "Account"}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter(account => account.id !== form.getValues().accountId)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
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
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
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
