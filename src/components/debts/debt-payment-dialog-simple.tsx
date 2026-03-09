"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DollarSign } from "lucide-react";

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
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  paymentAmount: z.coerce.number().positive("Payment amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  accountId: z.string().min(1, "Please select an account"),
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

export function DebtPaymentDialogSimple({ debt, open, onOpenChange, onSuccess }: DebtPaymentDialogProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      paymentAmount: debt.minimumPayment || 0,
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      accountId: "",
    },
  });

  useEffect(() => {
    if (open) {
      console.log("Simple payment dialog opened for debt:", debt.name);
      loadAccounts();
    }
  }, [open, debt.name]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsResult = await getAccounts();

      if (accountsResult.success) {
        setAccounts(accountsResult.data || []);
      } else {
        console.error("Failed to load accounts");
        toast.error("Failed to load accounts");
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (values.paymentAmount > debt.currentBalance) {
      toast.error("Payment amount cannot exceed current balance");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("paymentAmount", values.paymentAmount.toString());
      formData.append("paymentDate", values.paymentDate);
      formData.append("accountId", values.accountId);

      const result = await makeDebtPayment(
        debt.id, 
        values.paymentAmount, 
        values.paymentDate, 
        values.accountId
      );
      
      if (result.success) {
        toast.success(result.message || "Payment recorded successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Payment - {debt.name}</DialogTitle>
          <DialogDescription>
            Record a payment toward this debt. This will create a transaction and update your account balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(debt.currentBalance)}
              </div>
              {debt.minimumPayment && (
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum payment: {formatCurrency(debt.minimumPayment)}
                </p>
              )}
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="paymentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={debt.currentBalance}
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
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
                    <FormLabel>Pay From Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({formatCurrency(account.balance)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting ? "Processing..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
