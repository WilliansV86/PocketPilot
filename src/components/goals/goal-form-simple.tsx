"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface GoalFormSimpleProps {
  mode: "create" | "edit";
  goal?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const goalTypes = [
  { value: "SAVINGS", label: "Savings", icon: "💰" },
  { value: "DEBT_PAYOFF", label: "Debt Payoff", icon: "🏦" },
  { value: "PURCHASE", label: "Purchase", icon: "🛍️" },
  { value: "EMERGENCY_FUND", label: "Emergency Fund", icon: "🆘" },
  { value: "INVESTMENT", label: "Investment", icon: "📈" },
  { value: "OTHER", label: "Other", icon: "🎯" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function GoalFormSimple({ mode, goal, onCancel, onSuccess }: GoalFormSimpleProps) {
  const [formData, setFormData] = useState({
    name: goal?.name || "",
    type: goal?.type || "SAVINGS",
    targetAmount: goal?.targetAmount || "",
    startDate: goal?.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    targetDate: goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : "",
    linkedAccountId: goal?.linkedAccountId || "",
    linkedDebtId: goal?.linkedDebtId || "",
    autoTrack: goal?.autoTrack !== undefined ? goal.autoTrack : true,
    priority: goal?.priority || "MEDIUM",
    notes: goal?.notes || "",
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("type", formData.type);
      submitData.append("targetAmount", formData.targetAmount);
      submitData.append("startDate", formData.startDate);
      submitData.append("targetDate", formData.targetDate || "");
      submitData.append("linkedAccountId", formData.linkedAccountId || "");
      submitData.append("linkedDebtId", formData.linkedDebtId || "");
      submitData.append("autoTrack", formData.autoTrack.toString());
      submitData.append("priority", formData.priority);
      submitData.append("notes", formData.notes || "");

      const response = await fetch(
        mode === "create" ? "/api/goals" : `/api/goals/${goal.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: submitData,
        }
      );

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || "Failed to save goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("Failed to save goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Emergency Fund, New Car, Vacation"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Goal Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  {goalTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.targetAmount}
                onChange={(e) => handleInputChange("targetAmount", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleInputChange("targetDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about your goal..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : mode === "create" ? "Create Goal" : "Update Goal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
