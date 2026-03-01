"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  AlertCircle, 
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet,
  ReceiptText,
  Target,
  Plus,
  Settings,
  ArrowRightLeft
} from "lucide-react";
import { updateBudget } from "@/lib/actions/budget-actions";
import { useRouter } from "next/navigation";
import "@/styles/mobile-budgets.css";

type BudgetCategory = {
  id: string;
  name: string;
  group: string;
  color: string;
  icon: string;
  budgeted: number;
  activity: number;
  available: number;
  movesIn: number;
  movesOut: number;
  budgetId: string | null;
};

type BudgetData = {
  categories: BudgetCategory[];
  uncategorized: {
    count: number;
    total: number;
  };
  totals: {
    income: number;
    expenses: number;
    budgeted: number;
    available: number;
    leftToBudget: number;
  };
};

interface MobileBudgetsProps {
  data: BudgetData;
  month: string;
  year: number;
  onMonthChange: (month: string, year: number) => void;
  onDataUpdate?: (newData: BudgetData) => void;
}

export function MobileBudgets({ data, month, year, onMonthChange, onDataUpdate }: MobileBudgetsProps) {
  const router = useRouter();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const editInputRef = useRef<HTMLInputElement>(null);

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Filter out INCOME group and group categories
  const filteredCategories = data.categories.filter(cat => cat.group !== 'INCOME');
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  // Calculate group totals
  const groupTotals = Object.entries(groupedCategories).map(([group, categories]) => ({
    group,
    budgeted: categories.reduce((sum, cat) => sum + cat.budgeted, 0),
    activity: categories.reduce((sum, cat) => sum + cat.activity, 0),
    available: categories.reduce((sum, cat) => sum + cat.available, 0),
  }));

  const getGroupColor = (group: string) => {
    switch (group) {
      case 'NEEDS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WANTS': return 'bg-green-100 text-green-800 border-green-200';
      case 'SAVINGS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DEBT': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAvailableColor = (available: number) => {
    if (available < 0) return 'text-red-600 font-semibold';
    if (available === 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (activity: number, budgeted: number) => {
    if (budgeted === 0) return 'bg-gray-200';
    const percentage = (activity / budgeted) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  const startEditing = (categoryId: string, currentValue: number) => {
    setEditingCategory(categoryId);
    setEditValue(currentValue.toString());
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleBlur = async (categoryId: string) => {
    if (editingCategory === categoryId) {
      await saveBudget(categoryId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      saveBudget(categoryId);
    } else if (e.key === 'Escape') {
      setEditingCategory(null);
      setEditValue("");
    }
  };

  const saveBudget = async (categoryId: string) => {
    try {
      const newValue = parseFloat(editValue);
      if (isNaN(newValue) || newValue < 0) {
        toast.error("Please enter a valid positive number");
        return;
      }

      await updateBudget(categoryId, month, year, newValue);
      
      // Update local state immediately for better UX
      if (onDataUpdate) {
        onDataUpdate({
          ...data,
          categories: data.categories.map((cat: BudgetCategory) =>
            cat.id === categoryId
              ? { ...cat, budgeted: newValue, available: newValue - cat.activity }
              : cat
          )
        });
      }

      toast.success("Budget updated successfully");
    } catch (error) {
      toast.error("Failed to update budget");
    } finally {
      setEditingCategory(null);
      setEditValue("");
    }
  };

  const handleFixUncategorized = () => {
    const monthStr = month.padStart(2, '0');
    router.push(`/transactions?month=${year}-${monthStr}&uncategorized=true`);
  };

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* Mobile Header */}
      <div className="space-y-4">
        {/* Month Selector */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={month} onValueChange={(newMonth) => onMonthChange(newMonth, year)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, index) => (
                <SelectItem key={m} value={(index + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(newYear) => onMonthChange(month, parseInt(newYear))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Chips - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex-shrink-0 bg-green-50 border border-green-200 rounded-lg p-3 min-w-[140px]">
            <div className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Income</span>
            </div>
            <div className="text-lg font-bold text-green-900 mt-1">
              {formatCurrency(data.totals.income)}
            </div>
          </div>

          <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-3 min-w-[140px]">
            <div className="flex items-center gap-2 text-blue-800">
              <ReceiptText className="h-4 w-4" />
              <span className="text-xs font-medium">Expenses</span>
            </div>
            <div className="text-lg font-bold text-blue-900 mt-1">
              {formatCurrency(data.totals.expenses)}
            </div>
          </div>

          <div className="flex-shrink-0 bg-purple-50 border border-purple-200 rounded-lg p-3 min-w-[140px]">
            <div className="flex items-center gap-2 text-purple-800">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Budgeted</span>
            </div>
            <div className="text-lg font-bold text-purple-900 mt-1">
              {formatCurrency(data.totals.budgeted)}
            </div>
          </div>

          <div className="flex-shrink-0 bg-orange-50 border border-orange-200 rounded-lg p-3 min-w-[140px]">
            <div className="flex items-center gap-2 text-orange-800">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Left to Budget</span>
            </div>
            <div className={`text-lg font-bold mt-1 ${data.totals.leftToBudget < 0 ? 'text-red-600' : 'text-orange-900'}`}>
              {formatCurrency(data.totals.leftToBudget)}
            </div>
          </div>
        </div>
      </div>

      {/* Uncategorized Expenses Card */}
      {data.uncategorized.count > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Uncategorized Expenses</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {data.uncategorized.count} transactions • {formatCurrency(data.uncategorized.total)}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handleFixUncategorized}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Fix
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Groups */}
      {Object.entries(groupedCategories).map(([group, categories]) => {
        const groupTotal = groupTotals.find(gt => gt.group === group);
        const isCollapsed = collapsedGroups.has(group);
        
        return (
          <Collapsible
            key={group}
            open={!isCollapsed}
            onOpenChange={() => toggleGroup(group)}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getGroupColor(group)}>
                        {group}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {categories.length} categories
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(groupTotal?.available || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3">
              {categories.map((category) => (
                <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Category Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        
                        <div className={`text-lg font-bold ${getAvailableColor(category.available)}`}>
                          {formatCurrency(category.available)}
                        </div>
                      </div>

                      {/* Budgeted • Activity */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Budgeted</span>
                        <div className="flex items-center gap-2">
                          {editingCategory === category.id ? (
                            <Input
                              ref={editInputRef}
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleBlur(category.id)}
                              onKeyDown={(e) => handleKeyDown(e, category.id)}
                              className="w-24 h-8"
                            />
                          ) : (
                            <button
                              onClick={() => startEditing(category.id, category.budgeted)}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <span>{formatCurrency(category.budgeted)}</span>
                              <Edit className="h-3 w-3 opacity-60" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Activity</span>
                        <span>{formatCurrency(category.activity)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <ProgressBar
                          value={category.budgeted > 0 ? (category.activity / category.budgeted) * 100 : 0}
                          className="h-2"
                          style={{ 
                            backgroundColor: getProgressColor(category.activity, category.budgeted)
                          }}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{category.budgeted > 0 ? Math.round((category.activity / category.budgeted) * 100) : 0}% used</span>
                          {category.available < 0 && (
                            <span className="text-red-600 font-medium">
                              {formatCurrency(Math.abs(category.available))} over
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4 border-t">
        <div className="grid grid-cols-1 gap-2">
          <Button asChild variant="outline" className="w-full justify-start">
            <a href="/categories/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </a>
          </Button>
          
          <Button asChild variant="outline" className="w-full justify-start">
            <a href="/categories" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Categories
            </a>
          </Button>
          
          <Button className="w-full justify-start">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Move Money
          </Button>
        </div>
      </div>
    </div>
  );
}
