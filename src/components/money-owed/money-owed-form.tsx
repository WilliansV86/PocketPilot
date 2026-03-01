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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMoneyOwed, updateMoneyOwed, MoneyOwedFormData } from "@/lib/actions/money-owed-actions";
import { toast } from "sonner";

// Define the form validation schema
const formSchema = z.object({
  personName: z.string().min(1, "Person name is required"),
  description: z.string().optional(),
  amountOriginal: z.coerce.number().positive("Original amount must be positive"),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MoneyOwedFormProps {
  mode: "create" | "edit";
  moneyOwed?: any; // Money owed data for edit mode
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function MoneyOwedForm({ mode, moneyOwed, onCancel, onSuccess }: MoneyOwedFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      personName: moneyOwed?.personName || "",
      description: moneyOwed?.description || "",
      amountOriginal: moneyOwed?.amountOriginal?.toString() || "",
      dueDate: moneyOwed?.dueDate ? format(new Date(moneyOwed.dueDate), "yyyy-MM-dd") : "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("personName", values.personName);
        formData.append("description", values.description || "");
        formData.append("amountOriginal", values.amountOriginal.toString());
        formData.append("dueDate", values.dueDate || "");

        if (mode === "create") {
          const result = await createMoneyOwed(formData);
          if (result.success) {
            toast.success(result.message || "Money owed record created successfully");
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to create money owed record");
          }
        } else if (mode === "edit" && moneyOwed) {
          const result = await updateMoneyOwed(moneyOwed.id, formData);
          if (result.success) {
            toast.success(result.message || "Money owed record updated successfully");
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to update money owed record");
          }
        }
      } catch (error) {
        toast.error("Failed to save money owed record");
      }
    });
  };

  const hasPayments = moneyOwed?.payments && moneyOwed.payments.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create Money Owed Record" : "Edit Money Owed Record"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Add a new record for money owed to you"
              : hasPayments
              ? "Edit the details of this money owed record. Amount cannot be changed as payments have been recorded."
              : "Edit the details of this money owed record."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter person's name" {...field} />
                    </FormControl>
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
                      <Textarea
                        placeholder="What is this money owed for?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of what the money is owed for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountOriginal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={hasPayments}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {hasPayments
                        ? "Cannot be changed as payments have been recorded"
                        : "The original amount owed to you"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional due date for when you expect to receive payment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? mode === "create"
                      ? "Creating..."
                      : "Updating..."
                    : mode === "create"
                    ? "Create Record"
                    : "Update Record"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
