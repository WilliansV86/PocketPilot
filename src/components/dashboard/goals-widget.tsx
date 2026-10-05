"use client";


import { I18nText } from "@/components/language-provider";
import { useState, useEffect } from "react";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialProgress } from "@/components/charts/financial-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/currency";
import { getGoalTypeInfo } from "@/lib/finance/goals";

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
  currency?: string;
  goals?: GoalProgress[];
}

export function GoalsWidget({ goals = [], currency = "USD" }: GoalsWidgetProps) {
  const formatCurrency = (amount: number) => formatMoney(amount, currency);
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
          setGoalsData((result.data || []).filter((item: any) => (item.goal.currency || "USD") === currency));
        }
      } catch (error) {
        console.error("Failed to fetch goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [goals, currency]);

  if (loading) {
    return (
      <Card className="pp-chart-card min-w-0 gap-3 py-4 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5" />{" "}<I18nText text={"Goals Progress"}/>{" "}</CardTitle>
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
      <Card className="pp-chart-card min-w-0 gap-3 py-4 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5" />{" "}<I18nText text={"Goals Progress"}/>{" "}</CardTitle>
          <CardDescription>{" "}<I18nText text={"Track your financial goals"}/>{" "}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-3">
            <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{""}<I18nText text={"No Goals Yet"}/>{""}</h3>
            <p className="text-muted-foreground mb-4">{" "}<I18nText text={"Create your first financial goal to start tracking progress"}/>{" "}</p>
            <Button asChild>
              <a href="/goals">
                <Plus className="h-4 w-4 mr-2" />{" "}<I18nText text={"Create Goal"}/>{" "}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pp-chart-card min-w-0 gap-3 py-4 lg:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />{" "}<I18nText text={"Goals Progress"}/>{" "}</CardTitle>
            <CardDescription>
              {activeGoals.length}{" "}<I18nText text={"active goal"}/>{""}{activeGoals.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/goals">{" "}<I18nText text={"View All"}/>{" "}</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid items-start gap-4 sm:grid-cols-3">
          {topGoals.length > 0 ? (
            topGoals.map((goalProgress) => {
              const goal = goalProgress.goal;
              const typeInfo = getGoalTypeInfo(goal.type);

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{typeInfo.icon}</span>
                      <span className="min-w-0 break-words font-medium text-sm">
                        {goal.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {goalProgress.percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(goalProgress.remainingAmount)}{" "}<I18nText text={"left"}/>{" "}</div>
                    </div>
                  </div>
                  
                  <FinancialProgress value={goalProgress.percentage} label={`${goal.name} progress`} status={goalProgress.status} />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goalProgress.currentAmount)}</span>
                    <span>{formatCurrency(goalProgress.targetAmount)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">{" "}<I18nText text={"All goals completed! 🎉"}/>{" "}</p>
            </div>
          )}

          {activeGoals.length > 3 && (
            <div className="border-t pt-2 sm:col-span-3">
              <p className="text-xs text-muted-foreground text-center">{" "}<I18nText text={"And"}/>{" "}{activeGoals.length - 3}{" "}<I18nText text={"more goal"}/>{""}{activeGoals.length - 3 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
