"use client";

import { useState, useEffect } from "react";
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
import { recordMoneyOwedPayment, updateMoneyOwedPayment } from "@/lib/actions/money-owed-actions";
import { getAccounts } from "@/lib/actions/account-actions";
import { formatMoney as formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  date: z.string().min(1, "Payment date is required"),
  accountId: z.string().min(1, "Please select an account"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MoneyOwed {
  id: string;
  personName: string;
  description?: string;
  currency?: string;
  amountOriginal: number;
  amountOutstanding: number;
  dueDate?: string;
  status: string;
}

interface MoneyOwedPaymentDialogProps {
  payment?: { id: string; amount: number; date: string | Date; accountId: string; note?: string | null };
  moneyOwed: MoneyOwed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MoneyOwedPaymentDialog({ moneyOwed, payment, open, onOpenChange, onSuccess }: MoneyOwedPaymentDialogProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maximumPayment = moneyOwed.amountOutstanding + (payment ? Number(payment.amount) : 0);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: moneyOwed.amountOutstanding,
      date: format(new Date(), "yyyy-MM-dd"),
      accountId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ amount: payment ? Number(payment.amount) : moneyOwed.amountOutstanding,
        date: payment ? new Date(payment.date).toISOString().slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
        accountId: payment?.accountId || "", note: payment?.note || "" });
      loadAccounts();
    }
  }, [open, moneyOwed.id, payment]);

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
    if (values.amount > maximumPayment) {
      toast.error("Payment amount cannot exceed outstanding amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", values.amount.toString());
      formData.append("date", values.date);
      formData.append("accountId", values.accountId);
      formData.append("note", values.note || "");

      const result = payment ? await updateMoneyOwedPayment(moneyOwed.id, payment.id, formData) : await recordMoneyOwedPayment(moneyOwed.id, formData);
      
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
          <DialogTitle>{payment ? "Edit Payment" : "Record Payment"} - {moneyOwed.personName}</DialogTitle>
          <DialogDescription>
            {payment ? "Correct this payment. The remaining balance, receiving account, and income transaction will update together." : "Record a payment received from this person. This will create an income transaction and update your account balance."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Outstanding Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(moneyOwed.amountOutstanding, moneyOwed.currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Original: {formatCurrency(moneyOwed.amountOriginal, moneyOwed.currency)}
              </p>
              {moneyOwed.dueDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {format(new Date(moneyOwed.dueDate), "MMM dd, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maximumPayment}
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
                name="date"
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
                    <FormLabel>Received Into Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.filter(account => account.currency === (moneyOwed.currency || "USD")).map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({formatCurrency(account.balance, account.currency)})
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
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add a note about this payment" {...field} />
                    </FormControl>
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
                  {isSubmitting ? "Saving..." : payment ? "Save Payment" : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
