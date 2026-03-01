"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDebt, updateDebt, DebtFormValues } from "@/lib/actions/debt-actions";
import { toast } from "sonner";

// Define the form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CREDIT_CARD", "PERSONAL_LOAN", "AUTO_LOAN", "MORTGAGE", "STUDENT_LOAN", "MEDICAL", "OTHER"]),
  lender: z.string().optional(),
  originalAmount: z.coerce.number().positive("Original amount must be positive").optional().or(z.literal("")),
  currentBalance: z.coerce.number().min(0, "Current balance must be non-negative"),
  interestRateAPR: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  minimumPayment: z.coerce.number().min(0).optional().or(z.literal("")),
  dueDayOfMonth: z.coerce.number().min(1).max(31).optional().or(z.literal("")),
  notes: z.string().optional(),
  isClosed: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface DebtFormProps {
  mode: "create" | "edit";
  debt?: any; // Debt data for edit mode
  onCancel?: () => void;
  onSuccess?: () => void;
}

const debtTypeOptions = [
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "PERSONAL_LOAN", label: "Personal Loan" },
  { value: "AUTO_LOAN", label: "Auto Loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "STUDENT_LOAN", label: "Student Loan" },
  { value: "MEDICAL", label: "Medical Debt" },
  { value: "OTHER", label: "Other" },
];

export function DebtForm({ mode, debt, onCancel, onSuccess }: DebtFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: debt?.name || "",
      type: debt?.type || "CREDIT_CARD",
      lender: debt?.lender || "",
      originalAmount: debt?.originalAmount?.toString() || "",
      currentBalance: debt?.currentBalance?.toString() || "0",
      interestRateAPR: debt?.interestRateAPR?.toString() || "",
      minimumPayment: debt?.minimumPayment?.toString() || "",
      dueDayOfMonth: debt?.dueDayOfMonth?.toString() || "",
      notes: debt?.notes || "",
      isClosed: debt?.isClosed || false,
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("type", values.type);
        formData.append("lender", values.lender || "");
        formData.append("originalAmount", (values.originalAmount || "").toString());
        formData.append("currentBalance", values.currentBalance.toString());
        formData.append("interestRateAPR", (values.interestRateAPR || "").toString());
        formData.append("minimumPayment", (values.minimumPayment || "").toString());
        formData.append("dueDayOfMonth", (values.dueDayOfMonth || "").toString());
        formData.append("notes", values.notes || "");
        formData.append("isClosed", values.isClosed.toString());

        if (mode === "create") {
          const result = await createDebt(formData);
          if (result.success) {
            toast.success(result.message || "Debt created successfully");
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to create debt");
          }
        } else if (mode === "edit" && debt) {
          const result = await updateDebt(debt.id, formData);
          if (result.success) {
            toast.success(result.message || "Debt updated successfully");
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to update debt");
          }
        }
      } catch (error) {
        toast.error("Failed to save debt");
      }
    });
  };

  const currentBalance = parseFloat(String(form.watch("currentBalance") || "0"));
  const originalAmount = parseFloat(String(form.watch("originalAmount") || "0"));
  const progressPercentage = originalAmount > 0 ? ((originalAmount - currentBalance) / originalAmount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Debt" : "Edit Debt"}</CardTitle>
        <CardDescription>
          {mode === "create" 
            ? "Add a new debt to track your payments and progress."
            : "Update the debt information and track your progress."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debt Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chase Credit Card" {...field} />
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
                    <FormLabel>Debt Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select debt type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {debtTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="lender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lender</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chase Bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
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
                name="originalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Original amount to track payment progress
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRateAPR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (APR %)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
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
                name="minimumPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Payment</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
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
                name="dueDayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Day of Month</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Day of the month payment is due (1-31)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Progress indicator */}
            {originalAmount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Progress</span>
                  <span>{progressPercentage.toFixed(1)}% paid</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  ${currentBalance.toFixed(2)} remaining of ${originalAmount.toFixed(2)}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this debt..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isClosed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as closed</FormLabel>
                    <FormDescription>
                      Check if this debt has been fully paid off
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : mode === "create" ? "Create Debt" : "Update Debt"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
