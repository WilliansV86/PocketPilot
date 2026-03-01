"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getGoalTypeInfo, getProgressColor } from "@/lib/finance/goals";

interface GoalProgress {
  goal: any;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  remainingAmount: number;
  isCompleted: boolean;
  status: 'on-track' | 'behind' | 'completed' | 'not-started';
  daysRemaining?: number;
  monthlyProgressNeeded?: number;
}

interface GoalsWidgetProps {
  goals?: GoalProgress[];
}

export function GoalsWidget({ goals = [] }: GoalsWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [goalsData, setGoalsData] = useState<GoalProgress[]>(goals);

  useEffect(() => {
    if (goals.length > 0) {
      setGoalsData(goals);
      setLoading(false);
      return;
    }

    // Fetch goals if not provided
    const fetchGoals = async () => {
      try {
        const response = await fetch("/api/goals");
        const result = await response.json();
        
        if (result.success) {
          setGoalsData(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [goals]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-2 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goalsData.filter(g => !g.isCompleted);
  const topGoals = activeGoals.slice(0, 3);

  if (goalsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals Progress
          </CardTitle>
          <CardDescription>
            Track your financial goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first financial goal to start tracking progress
            </p>
            <Button asChild>
              <a href="/goals">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals Progress
            </CardTitle>
            <CardDescription>
              {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/goals">
              View All
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topGoals.length > 0 ? (
            topGoals.map((goalProgress) => {
              const goal = goalProgress.goal;
              const typeInfo = getGoalTypeInfo(goal.type);
              const progressColorClass = getProgressColor(goalProgress.percentage);

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{typeInfo.icon}</span>
                      <span className="font-medium text-sm truncate max-w-[150px]">
                        {goal.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {goalProgress.percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(goalProgress.remainingAmount)} left
                      </div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={goalProgress.percentage} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goalProgress.currentAmount)}</span>
                    <span>{formatCurrency(goalProgress.targetAmount)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                All goals completed! 🎉
              </p>
            </div>
          )}

          {activeGoals.length > 3 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                And {activeGoals.length - 3} more goal{activeGoals.length - 3 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
