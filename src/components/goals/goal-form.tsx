"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon as CalendarLucide, Target, TrendingUp, DollarSign, Calendar as CalendarIconLucide, Flag, Link2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const goalFormSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  type: z.enum(["SAVINGS", "DEBT_PAYOFF", "PURCHASE", "EMERGENCY_FUND", "INVESTMENT", "OTHER"]),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  startDate: z.date().refine((date) => date !== undefined, {
    message: "Start date is required",
  }),
  targetDate: z.date().optional(),
  linkedAccountId: z.string().optional(),
  linkedDebtId: z.string().optional(),
  autoTrack: z.boolean().default(true),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.type === "DEBT_PAYOFF" && !data.linkedDebtId) {
    return false;
  }
  if (data.type === "SAVINGS" && data.linkedAccountId && data.linkedDebtId) {
    return false;
  }
  if (data.targetDate && data.startDate && data.targetDate <= data.startDate) {
    return false;
  }
  return true;
}, {
  message: "Invalid goal configuration",
  path: ["type"],
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  mode: "create" | "edit";
  goal?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const goalTypes = [
  { value: "SAVINGS", label: "Savings", icon: "💰", description: "Build up savings over time" },
  { value: "DEBT_PAYOFF", label: "Debt Payoff", icon: "🏦", description: "Pay off debt completely" },
  { value: "PURCHASE", label: "Purchase", icon: "🛍️", description: "Save for a specific purchase" },
  { value: "EMERGENCY_FUND", label: "Emergency Fund", icon: "🆘", description: "Build emergency fund" },
  { value: "INVESTMENT", label: "Investment", icon: "📈", description: "Investment goal" },
  { value: "OTHER", label: "Other", icon: "🎯", description: "Custom financial goal" },
];

const priorities = [
  { value: "LOW", label: "Low", color: "text-green-600" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
  { value: "HIGH", label: "High", color: "text-red-600" },
];

export function GoalForm({ mode, goal, onCancel, onSuccess }: GoalFormProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema) as any,
    defaultValues: goal || {
      name: "",
      type: "SAVINGS",
      targetAmount: 0,
      startDate: new Date(),
      targetDate: undefined,
      linkedAccountId: "",
      linkedDebtId: "",
      autoTrack: true,
      priority: "MEDIUM",
      notes: "",
    },
  });

  const selectedType = form.watch("type");
  const autoTrack = form.watch("autoTrack");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsResult, debtsResult] = await Promise.all([
        fetch("/api/goals/accounts").then(res => res.json()),
        fetch("/api/goals/debts").then(res => res.json()),
      ]);

      if (accountsResult.success) {
        setAccounts(accountsResult.data || []);
      }
      if (debtsResult.success) {
        setDebts(debtsResult.data || []);
      }
    } catch (error) {
      console.error("Error loading form data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: GoalFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("targetAmount", values.targetAmount.toString());
      formData.append("startDate", values.startDate.toISOString());
      if (values.targetDate) {
        formData.append("targetDate", values.targetDate.toISOString());
      }
      if (values.linkedAccountId) {
        formData.append("linkedAccountId", values.linkedAccountId);
      }
      if (values.linkedDebtId) {
        formData.append("linkedDebtId", values.linkedDebtId);
      }
      formData.append("autoTrack", values.autoTrack.toString());
      formData.append("priority", values.priority);
      if (values.notes) {
        formData.append("notes", values.notes);
      }

      const response = await fetch(
        mode === "create" ? "/api/goals" : `/api/goals/${goal.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        console.error("Failed to save goal:", result.error);
      }
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {mode === "create" ? "Create Goal" : "Edit Goal"}
        </CardTitle>
        <CardDescription>
          {mode === "create" 
            ? "Set up a new financial goal to track your progress"
            : "Update your goal details and tracking preferences"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Emergency Fund, New Car, Vacation" {...field} />
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
                    <FormLabel>Goal Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goalTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
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
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarLucide className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarIcon
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date: any) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarLucide className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarIcon
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date: any) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Tracking Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoTrack"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-Track Progress</FormLabel>
                      <FormDescription>
                        Automatically update progress based on linked account or debt
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {autoTrack && (
                <>
                  {selectedType === "SAVINGS" && (
                    <FormField
                      control={form.control}
                      name="linkedAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link to Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account to track" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts
                                .filter(account => ["CHECKING", "SAVINGS", "INVESTMENT"].includes(account.type))
                                .map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name} ({account.type})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedType === "DEBT_PAYOFF" && (
                    <FormField
                      control={form.control}
                      name="linkedDebtId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link to Debt</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select debt to track" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {debts.map((debt) => (
                                <SelectItem key={debt.id} value={debt.id}>
                                  {debt.name} - {debt.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <Flag className={`h-4 w-4 ${priority.color}`} />
                              <span>{priority.label}</span>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about your goal..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "create" ? "Create Goal" : "Update Goal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
