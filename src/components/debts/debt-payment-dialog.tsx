"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { DollarSign, Calendar, CreditCard, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { makeDebtPayment } from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/account-actions";
import { getCategories } from "@/lib/actions/category-actions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  paymentAmount: z.coerce.number().positive("Payment amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  accountId: z.string().min(1, "Please select an account"),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Debt {
  id: string;
  name: string;
  type: string;
  lender?: string;
  currentBalance: number;
  minimumPayment?: number;
  dueDayOfMonth?: number;
}

interface DebtPaymentDialogProps {
  debt: Debt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DebtPaymentDialog({ debt, open, onOpenChange, onSuccess }: DebtPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      paymentAmount: debt.minimumPayment || 0,
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      accountId: "",
      categoryId: "",
    },
  });

  useEffect(() => {
    if (open) {
      console.log("Payment dialog opened for debt:", debt.name);
      loadData();
    }
  }, [open, debt.name]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsResult, categoriesResult] = await Promise.all([
        getAccounts(),
        getCategories(),
      ]);

      if (accountsResult.success) {
        setAccounts(accountsResult.data || []);
      } else {
        console.error("Failed to load accounts");
        toast.error("Failed to load accounts");
      }

      if (categoriesResult.success) {
        // Filter for DEBT group categories or create a default one
        const debtCategories = categoriesResult.data?.filter(
          (cat: any) => cat.group === "DEBT"
        ) || [];
        setCategories(debtCategories);
      } else {
        console.error("Failed to load categories");
        // Don't show error for categories as they're optional
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (values.paymentAmount > debt.currentBalance) {
      toast.error("Payment amount cannot exceed current balance");
      return;
    }

    startTransition(async () => {
      try {
        const result = await makeDebtPayment(
          debt.id,
          values.paymentAmount,
          values.paymentDate,
          values.accountId,
          values.categoryId || undefined
        );

        if (result.success) {
          toast.success(result.message);
          onSuccess();
          onOpenChange(false);
          form.reset();
        } else {
          toast.error(result.error || "Failed to process payment");
        }
      } catch (error) {
        toast.error("Failed to process payment");
      }
    });
  };

  const paymentAmount = form.watch("paymentAmount");
  const remainingBalance = debt.currentBalance - (paymentAmount || 0);
  const isPayoff = remainingBalance <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make Payment to {debt.name}</DialogTitle>
          <DialogDescription>
            Record a payment and create a corresponding expense transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Debt Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Debt Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{formatCurrency(debt.currentBalance)}</span>
              </div>
              {debt.minimumPayment && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Minimum Payment:</span>
                  <span className="font-medium">{formatCurrency(debt.minimumPayment)}</span>
                </div>
              )}
              {debt.dueDayOfMonth && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Due Day:</span>
                  <span className="font-medium">Day {debt.dueDayOfMonth}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="paymentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum: {formatCurrency(debt.currentBalance)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Preview */}
              {paymentAmount > 0 && (
                <Card className={isPayoff ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      {isPayoff ? (
                        <AlertTriangle className="h-4 w-4 text-green-600" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      )}
                      <div className="text-sm">
                        {isPayoff ? (
                          <span className="text-green-700 font-medium">
                            🎉 This will pay off the debt completely!
                          </span>
                        ) : (
                          <span className="text-blue-700">
                            Remaining balance after payment: {formatCurrency(remainingBalance)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay From Account *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account to pay from">
                            {loading ? "Loading..." : "Select account"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {formatCurrency(account.balance)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The account balance will be reduced by this payment amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categorize this expense for better tracking
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || loading}>
                  {isPending ? "Processing..." : `Pay ${formatCurrency(paymentAmount || 0)}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
