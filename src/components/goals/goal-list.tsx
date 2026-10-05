"use client";
import { useLanguage } from "@/components/language-provider";

import { I18nText } from "@/components/language-provider";
import { useState } from "react";
import { Target, TrendingUp, Calendar, Flag, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { CurrencyPicker, usePreferredCurrency } from "@/components/ui/currency-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionMenuButton } from "@/components/ui/action-menu-button";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { FinancialProgress } from "@/components/charts/financial-charts";
import { formatMoney } from "@/lib/currency";
import { statsDateLabel } from "@/lib/stats-date-range";
import { getGoalTypeInfo, getPriorityColor, formatGoalProgress } from "@/lib/finance/goals";

interface Goal {
  id: string;
  name: string;
  type: string;
  currency?: string;
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
  onCreate?: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onComplete: (goalId: string) => void;
  onAddContribution: (goalId: string) => void;
}

export function GoalList({ goals, onCreate, onEdit, onDelete, onComplete, onAddContribution }: GoalListProps) {
 const { t: ppT } = useLanguage();

 const [currency,setCurrency] = usePreferredCurrency("goals");
 const [filter,setFilter] = useState<"all"|"active"|"completed">("all");
 const currencyGoals = goals.filter(item => (item.goal.currency || "USD") === currency);
 const activeGoals = currencyGoals.filter(item => !item.isCompleted);
 const completedGoals = currencyGoals.filter(item => item.isCompleted);
 const filteredGoals = currencyGoals.filter(item => filter === "all" || (filter === "completed" ? item.isCompleted : !item.isCompleted));
 const money = (value:number) => formatMoney(value,currency);
 return <div className="space-y-4">
  <CurrencyPicker remember compact preferenceKey="goals" value={currency} onChange={setCurrency} />
  <SummaryStrip items={[
   { label:"Goals",value:currencyGoals.length,detail:`${activeGoals.length} active · ${completedGoals.length} completed`,icon:Target },
   { label:"Tracked progress",value:money(activeGoals.reduce((sum,item)=>sum+item.currentAmount,0)),detail:"Across active goals",icon:TrendingUp },
   { label:"Active targets",value:money(activeGoals.reduce((sum,item)=>sum+item.targetAmount,0)),icon:Flag },
   { label:"Completed",value:`${currencyGoals.length ? Math.round(completedGoals.length/currencyGoals.length*100) : 0}%`,icon:CheckCircle,tone:"good" },
  ]} />
  <div className="flex flex-wrap gap-2" aria-label={ppT("Filter goals")}>{([['all','All',currencyGoals.length],['active','Active',activeGoals.length],['completed','Completed',completedGoals.length]] as const).map(([value,label,count])=><Button key={value} type="button" size="sm" className="min-h-10" aria-pressed={filter===value} variant={filter===value ? "default":"outline"} onClick={()=>setFilter(value)}>{label} ({count})</Button>)}</div>
  <div className="grid items-start gap-3 lg:grid-cols-2">
   {!filteredGoals.length && <div className="rounded-xl border p-5 text-center lg:col-span-2"><Target aria-hidden="true" className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><h2 className="font-semibold">{""}<I18nText text={"No"}/>{" "}<I18nText text={filter === "all" ? "" : filter+" "}/>{""}<I18nText text={"goals in"}/>{" "}{currency}</h2><p className="mt-1 text-sm text-muted-foreground">{""}<I18nText text={"Choose another currency or create a goal."}/>{""}</p>{onCreate && filter!=="completed" && <Button className="mt-3" onClick={onCreate}><Plus className="h-4 w-4" />{""}<I18nText text={"Create goal"}/>{""}</Button>}</div>}
   {filteredGoals.map(progress=>{
    const goal=progress.goal;const info=getGoalTypeInfo(goal.type);const formatted=formatGoalProgress(progress);
    return <article key={goal.id} aria-label={goal.name} className="min-w-0 space-y-3 rounded-xl border bg-card p-4">
     <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-base font-semibold"><span aria-hidden="true" className="mr-2">{info.icon}</span>{goal.name}</h2><div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs"><Badge className={getPriorityColor(goal.priority)}><I18nText text={goal.priority}/></Badge><span className={formatted.statusColor}><I18nText text={formatted.status}/></span></div></div>
      <DropdownMenu><DropdownMenuTrigger asChild><ActionMenuButton label={`Actions for ${goal.name}`} /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={()=>onEdit(goal)}><Edit className="mr-2 h-4 w-4" />{""}<I18nText text={"Edit"}/>{""}</DropdownMenuItem>{!progress.isCompleted && goal.type!=="DEBT_PAYOFF" && <DropdownMenuItem onClick={()=>onAddContribution(goal.id)}><Plus className="mr-2 h-4 w-4" />{""}<I18nText text={"Add contribution"}/>{""}</DropdownMenuItem>}{!progress.isCompleted && <DropdownMenuItem onClick={()=>onComplete(goal.id)}><CheckCircle className="mr-2 h-4 w-4" />{""}<I18nText text={"Mark complete"}/>{""}</DropdownMenuItem>}<DropdownMenuItem className="text-destructive" onClick={()=>onDelete(goal.id)}><Trash2 className="mr-2 h-4 w-4" />{""}<I18nText text={"Delete"}/>{""}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
     </div>
     <div className="space-y-2"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold tabular-nums">{money(progress.currentAmount)}</span><span className="text-muted-foreground">{""}<I18nText text={"of"}/>{" "}{money(progress.targetAmount)}</span></div><FinancialProgress value={progress.percentage} label={`${goal.name} progress`} status={progress.status} /><div className="flex flex-wrap justify-between gap-2 text-xs"><span className={formatted.statusColor}>{formatted.percentage}</span><span className="text-muted-foreground">{money(progress.remainingAmount)}{" "}<I18nText text={"remaining"}/>{""}</span></div></div>
     {(goal.targetDate || progress.monthlyProgressNeeded) && <div className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">{goal.targetDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{""}<I18nText text={"Target"}/>{" "}<I18nText text={statsDateLabel(goal.targetDate)}/></span>}{!!progress.monthlyProgressNeeded && !progress.isCompleted && <span>{""}<I18nText text={"Need"}/>{" "}{money(progress.monthlyProgressNeeded)}{""}<I18nText text={"/month"}/>{""}</span>}</div>}
     {(goal.autoTrack || goal.notes) && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer py-1">{""}<I18nText text={"Tracking details"}/>{""}</summary>{goal.autoTrack && <p className="mt-1">{""}<I18nText text={"Auto-tracking"}/>{""}{goal.linkedAccount ? ` · ${goal.linkedAccount.name}` : goal.linkedDebt ? ` · ${goal.linkedDebt.name}` : ""}</p>}{goal.notes && <p className="mt-1 break-words">{goal.notes}</p>}</details>}
    </article>;
   })}
  </div>
 </div>;
}
