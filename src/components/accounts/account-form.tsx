"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAccount, updateAccount } from "@/lib/actions/account-actions";
import { formatCurrency } from "@/lib/utils";
import { safeServerAction } from "@/lib/client-actions";
import { toast } from "sonner";
import { AccountTypeBadge } from "@/components/accounts/account-type-badge";

// Account types from our updated Prisma schema
const accountTypes = [
  { value: "CHECKING", label: "Checking" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "CASH", label: "Cash" },
  { value: "LOAN", label: "Loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "OTHER", label: "Other" },
];

// Currencies for the dropdown
const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

// Define the form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Account type is required"),
  balance: z.coerce.number().default(0),
  currency: z.string().default("USD"),
});

type FormValues = z.infer<typeof formSchema>;

type AccountFormProps = {
  account?: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
  };
  mode: "create" | "edit";
};

export function AccountForm({ account, mode }: AccountFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Default values for the form
  const defaultValues = account
    ? {
        name: account.name,
        type: account.type,
        balance: Number(account.balance) || 0,
        currency: account.currency || "USD",
      }
    : {
        name: "",
        type: "CHECKING",
        balance: 0,
        currency: "USD",
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("type", values.type);
        formData.append("balance", values.balance.toString());
        formData.append("currency", values.currency);

        if (mode === "create") {
          const result = await safeServerAction(
            () => (createAccount as any)(formData),
            // Fallback function for browser preview - persist new account in localStorage
            async () => {
              // For browser preview, store the new account in localStorage
              const newAccounts = JSON.parse(localStorage.getItem('newAccounts') || '[]');
              const newAccount = {
                id: 'preview-' + Date.now(),
                name: values.name,
                type: values.type,
                balance: values.balance,
                currency: values.currency,
                userId: 'preview',
                createdAt: new Date(),
                updatedAt: new Date()
              };
              newAccounts.push(newAccount);
              localStorage.setItem('newAccounts', JSON.stringify(newAccounts));
              return { 
                success: true, 
                message: "Account created (preview mode)",
                data: newAccount
              };
            }
          );
          if (result.success) {
            toast.success(result.message || "Account created successfully");
            // Navigate back to accounts list
            router.push("/accounts");
            router.refresh();
          } else {
            toast.error((result as any).error || "Failed to create account");
          }
        } else if (mode === "edit" && account) {
          const result = await safeServerAction(
            () => (updateAccount as any)(account.id, formData),
            // Fallback function for browser preview - persist update in localStorage
            async () => {
              // For browser preview, store the updated account in localStorage
              const updatedAccounts = JSON.parse(localStorage.getItem('updatedAccounts') || '{}');
              updatedAccounts[account.id] = {
                id: account.id,
                name: values.name,
                type: values.type,
                balance: values.balance,
                currency: values.currency,
                userId: 'preview',
                createdAt: new Date(),
                updatedAt: new Date()
              };
              localStorage.setItem('updatedAccounts', JSON.stringify(updatedAccounts));
              return { 
                success: true, 
                message: "Account updated (preview mode)",
                data: updatedAccounts[account.id]
              };
            }
          );
          if (result.success) {
            toast.success(result.message || "Account updated successfully");
            // Navigate back to accounts list
            router.push("/accounts");
            router.refresh();
          } else {
            toast.error((result as any).error || "Failed to update account");
          }
        }
      } catch (error) {
        console.error("Failed to save account:", error);
        toast.error("Failed to save account");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Main Checking" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <AccountTypeBadge 
                          type={type.value} 
                          size="sm" 
                          variant="outline"
                        />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Balance</FormLabel>
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
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create Account" : "Update Account"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/accounts")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
