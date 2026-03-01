"use client";

import { useState, useEffect } from "react";
import { Target, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GoalList } from "@/components/goals/goal-list";
import { GoalFormSimple } from "@/components/goals/goal-form-simple";
import { PATTERNS, TYPOGRAPHY, BUTTON, SPACING } from "@/lib/ui-constants";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate?: string;
  linkedAccountId?: string;
  linkedDebtId?: string;
  autoTrack: boolean;
  priority: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  linkedAccount?: any;
  linkedDebt?: any;
  contributions?: any[];
}

interface GoalProgress {
  goal: Goal;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  remainingAmount: number;
  isCompleted: boolean;
  status: 'on-track' | 'behind' | 'completed' | 'not-started';
  daysRemaining?: number;
  monthlyProgressNeeded?: number;
}

export function GoalsClient() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals");
      const result = await response.json();

      if (result.success) {
        setGoals(result.data || []);
        // Show message if goals module is not available
        if (result.message && result.message.includes('database migration')) {
          toast.info("Goals module requires database migration. Please contact administrator.");
        }
      } else {
        console.error("Failed to load goals:", result.error);
        toast.error(result.error || "Failed to load goals");
      }
    } catch (error) {
      console.error("Error loading goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Goal deleted successfully");
        loadGoals();
      } else {
        toast.error(result.error || "Failed to delete goal");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/complete`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Goal marked as completed");
        loadGoals();
      } else {
        toast.error(result.error || "Failed to complete goal");
      }
    } catch (error) {
      console.error("Error completing goal:", error);
      toast.error("Failed to complete goal");
    }
  };

  const handleAddContribution = (goalId: string) => {
    // TODO: Implement contribution dialog
    toast.info("Contribution feature coming soon!");
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingGoal(null);
    loadGoals();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className={PATTERNS.PAGE_CONTENT}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h2 className={TYPOGRAPHY.SECTION_TITLE}>Loading Goals...</h2>
            <p className={TYPOGRAPHY.SECTION_SUBTITLE}>Please wait while we load your financial goals</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={PATTERNS.PAGE_CONTENT}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={TYPOGRAPHY.PAGE_TITLE}>Financial Goals</h1>
          <p className={TYPOGRAPHY.SECTION_SUBTITLE}>
            Track your progress toward savings, debt payoff, and other financial targets
          </p>
        </div>
        <Button onClick={handleCreateGoal} className={BUTTON.PRIMARY_ACTION}>
          <Plus className="h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Goals List */}
      <div className={SPACING.MARGIN.SECTION}>
        <GoalList
          goals={goals}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
          onComplete={handleCompleteGoal}
          onAddContribution={handleAddContribution}
        />
      </div>

      {/* Goal Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Create New Goal' : 'Edit Goal'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create' 
                ? 'Set up a new financial goal to track your progress'
                : 'Update your goal details and tracking preferences'
              }
            </DialogDescription>
          </DialogHeader>
          <GoalFormSimple
            mode={formMode}
            goal={editingGoal || undefined}
            onCancel={handleFormCancel}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
