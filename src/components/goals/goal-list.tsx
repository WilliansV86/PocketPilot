"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Flag, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle,
  DollarSign,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { 
  getGoalTypeInfo, 
  getPriorityColor, 
  getProgressColor, 
  formatGoalProgress 
} from "@/lib/finance/goals";

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

interface GoalListProps {
  goals: GoalProgress[];
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onComplete: (goalId: string) => void;
  onAddContribution: (goalId: string) => void;
}

export function GoalList({ 
  goals, 
  onEdit, 
  onDelete, 
  onComplete, 
  onAddContribution 
}: GoalListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return !goal.isCompleted;
    if (filter === 'completed') return goal.isCompleted;
    return true;
  });

  const activeGoals = filteredGoals.filter(g => !g.isCompleted);
  const completedGoals = filteredGoals.filter(g => g.isCompleted);

  const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeGoals.length} active, {completedGoals.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaved)}</div>
            <p className="text-xs text-muted-foreground">
              Across {activeGoals.length} active goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
            <p className="text-xs text-muted-foreground">
              Combined goal targets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredGoals.length > 0 
                ? `${Math.round((completedGoals.length / filteredGoals.length) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Goals completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({filteredGoals.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({activeGoals.length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed ({completedGoals.length})
        </Button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {filter === 'completed' 
                  ? "You haven't completed any goals yet."
                  : filter === 'active'
                  ? "No active goals. Create your first goal to get started!"
                  : "No goals yet. Create your first goal to get started!"
                }
              </p>
              {filter !== 'completed' && (
                <Button onClick={() => onEdit(null as any)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredGoals.map((goalProgress) => {
            const goal = goalProgress.goal;
            const typeInfo = getGoalTypeInfo(goal.type);
            const priorityColors = getPriorityColor(goal.priority);
            const progressColors = formatGoalProgress(goalProgress);
            const progressColorClass = getProgressColor(goalProgress.percentage);

            return (
              <Card key={goal.id} className={goalProgress.isCompleted ? 'opacity-75' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {goalProgress.isCompleted && (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={priorityColors}>
                          <Flag className="h-3 w-3 mr-1" />
                          {goal.priority}
                        </Badge>
                        {goal.targetDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                          </div>
                        )}
                        {goalProgress.daysRemaining !== undefined && !goalProgress.isCompleted && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {goalProgress.daysRemaining} days remaining
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(goal)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!goalProgress.isCompleted && goal.type !== 'DEBT_PAYOFF' && (
                          <DropdownMenuItem onClick={() => onAddContribution(goal.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contribution
                          </DropdownMenuItem>
                        )}
                        {!goalProgress.isCompleted && (
                          <DropdownMenuItem onClick={() => onComplete(goal.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDelete(goal.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className={progressColors.statusColor}>
                        {progressColors.percentage}
                      </span>
                    </div>
                    <Progress 
                      value={goalProgress.percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{progressColors.currentAmount}</span>
                      <span>{progressColors.targetAmount}</span>
                    </div>
                  </div>

                  {/* Status and Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${progressColors.statusColor}`}>
                        {progressColors.status}
                      </span>
                      {goalProgress.monthlyProgressNeeded && !goalProgress.isCompleted && (
                        <span className="text-muted-foreground">
                          Need {formatCurrency(goalProgress.monthlyProgressNeeded)}/month
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {formatCurrency(goalProgress.remainingAmount)} remaining
                    </div>
                  </div>

                  {/* Linked Information */}
                  {goal.autoTrack && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Auto-tracking enabled
                        {goal.linkedAccount && (
                          <span> • Linked to {goal.linkedAccount.name}</span>
                        )}
                        {goal.linkedDebt && (
                          <span> • Linked to {goal.linkedDebt.name}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {goal.notes && (
                    <div className="text-sm text-muted-foreground italic">
                      {goal.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
