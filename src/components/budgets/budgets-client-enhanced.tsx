"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getBudgetProgressColor, getGoalProgressColor, FINANCIAL_ANIMATIONS } from "@/lib/financial-colors";
import { formatCurrency } from "@/lib/format";
import { PATTERNS, TYPOGRAPHY, BUTTON, SPACING, LAYOUT } from "@/lib/ui-constants";
import { 
  ArrowDownUp, 
  Wallet, 
  ReceiptText, 
  Target, 
  ArrowRightLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter
} from "lucide-react";
import { getBudgetsForMonth, updateBudget, moveBudgetMoney, deleteBudget } from "@/lib/actions/budget-actions";
import { toast } from "sonner";
import { MobileBudgets } from "./mobile-budgets";

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

interface BudgetsClientProps {
  initialData?: BudgetData;
  initialMonth: string;
  initialYear: number;
}

export function BudgetsClientEnhanced({ initialData, initialMonth, initialYear }: BudgetsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BudgetData>(initialData || {
    categories: [],
    uncategorized: { count: 0, total: 0 },
    totals: { income: 0, expenses: 0, budgeted: 0, available: 0, leftToBudget: 0 }
  });
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveFromCategory, setMoveFromCategory] = useState<string>("");
  const [moveToCategory, setMoveToCategory] = useState<string>("");
  const [moveAmount, setMoveAmount] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year and 2 years back/forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Ref for inline editing
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fetch data when month/year changes or on initial mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getBudgetsForMonth(month, year);
        if (result.success && result.data) {
          setData(result.data);
          // Update URL if different from initial
          if (month !== initialMonth || year !== initialYear) {
            const params = new URLSearchParams(searchParams);
            params.set('month', month);
            params.set('year', year.toString());
            router.push(`/budgets?${params.toString()}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch budget data:", error);
        toast.error("Failed to load budget data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year, initialMonth, initialYear, searchParams, router]);

  // Auto-save on blur
  const handleBlur = (categoryId: string) => {
    if (editingCategory === categoryId) {
      saveEdit(categoryId);
    }
  };

  // Save on Enter key
  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      saveEdit(categoryId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleBudgetUpdate = async (categoryId: string, newAmount: number) => {
    try {
      const result = await updateBudget(categoryId, month, year, newAmount);
      if (result.success) {
        // Refresh data
        const refreshed = await getBudgetsForMonth(month, year);
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
        toast.success("Budget updated successfully");
      } else {
        toast.error(result.error || "Failed to update budget");
      }
    } catch (error) {
      console.error("Failed to update budget:", error);
      toast.error("Failed to update budget");
    }
    setEditingCategory(null);
  };

  const handleMoveMoney = async () => {
    if (!moveFromCategory || !moveToCategory || !moveAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(moveAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const result = await moveBudgetMoney(moveFromCategory, moveToCategory, month, year, amount);
      if (result.success) {
        // Refresh data
        const refreshed = await getBudgetsForMonth(month, year);
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
        toast.success("Money moved successfully");
        setMoveDialogOpen(false);
        setMoveFromCategory("");
        setMoveToCategory("");
        setMoveAmount("");
      } else {
        toast.error(result.error || "Failed to move money");
      }
    } catch (error) {
      console.error("Failed to move money:", error);
      toast.error("Failed to move money");
    }
  };

  const handleDeleteBudget = async (categoryId: string) => {
    try {
      const result = await deleteBudget(categoryId, month, year);
      if (result.success) {
        // Refresh data
        const refreshed = await getBudgetsForMonth(month, year);
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
        toast.success("Budget deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete budget");
      }
    } catch (error) {
      console.error("Failed to delete budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  const startEditing = (categoryId: string, currentValue: number) => {
    setEditingCategory(categoryId);
    setEditValue(currentValue.toString());
    // Focus the input after state update
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  const saveEdit = (categoryId: string) => {
    const newAmount = parseFloat(editValue);
    if (!isNaN(newAmount) && newAmount >= 0) {
      handleBudgetUpdate(categoryId, newAmount);
    } else {
      toast.error("Please enter a valid amount");
      setEditingCategory(null);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentMonthNum = parseInt(month);
    const currentYearNum = year;
    
    let newMonth = currentMonthNum;
    let newYear = currentYearNum;
    
    if (direction === 'prev') {
      newMonth = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
      newYear = currentMonthNum === 1 ? currentYearNum - 1 : currentYearNum;
    } else {
      newMonth = currentMonthNum === 12 ? 1 : currentMonthNum + 1;
      newYear = currentMonthNum === 12 ? currentYearNum + 1 : currentYearNum;
    }
    
    setMonth(newMonth.toString());
    setYear(newYear);
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

  const getAvailableColor = (available: number) => {
    if (available > 0) return "text-green-600";
    if (available < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getGroupColor = (group: string) => {
    switch(group) {
      case "NEEDS": return "bg-blue-100 text-blue-800";
      case "WANTS": return "bg-purple-100 text-purple-800";
      case "SAVINGS": return "bg-teal-100 text-teal-800";
      case "DEBT": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Group categories by group
  const groupedCategories = data.categories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  // Calculate group totals
  const groupTotals = Object.entries(groupedCategories).map(([group, categories]) => ({
    group,
    budgeted: categories.reduce((sum, cat) => sum + cat.budgeted, 0),
    activity: categories.reduce((sum, cat) => sum + cat.activity, 0),
    available: categories.reduce((sum, cat) => sum + cat.available, 0),
  }));

  const handleFixUncategorized = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    params.set('year', year.toString());
    params.set('uncategorized', 'true');
    router.push(`/transactions?${params.toString()}`);
  };

  return (
    <div className={PATTERNS.PAGE_CONTENT}>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileBudgets 
          data={data}
          month={month}
          year={year}
          onMonthChange={(newMonth, newYear) => {
            setMonth(newMonth);
            setYear(newYear);
          }}
          onDataUpdate={(newData) => setData(newData)}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <h1 className={TYPOGRAPHY.PAGE_TITLE}>Budgets</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className={BUTTON.ICON_SPACING}>
            <ChevronUp className="h-4 w-4 rotate-270" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((monthName, index) => (
                  <SelectItem key={monthName} value={(index + 1).toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((yearValue) => (
                  <SelectItem key={yearValue} value={yearValue.toString()}>
                    {yearValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className={BUTTON.ICON_SPACING}>
            Next
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={SPACING.MARGIN.SECTION}>
      <div className={LAYOUT.GRID.SUMMARY}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <ArrowDownUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totals.income)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <ReceiptText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totals.expenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totals.budgeted)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAvailableColor(data.totals.available)}`}>
              {formatCurrency(data.totals.available)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Left to Budget</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.totals.leftToBudget < 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(data.totals.leftToBudget)}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Uncategorized Expenses Widget */}
      {data.uncategorized.count > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Uncategorized Expenses
            </CardTitle>
            <CardDescription className="text-orange-700">
              You have {data.uncategorized.count} uncategorized transactions totaling {formatCurrency(data.uncategorized.total)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFixUncategorized} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Fix Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <a href="/categories/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/categories" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Categories
            </a>
          </Button>
        </div>
        
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Move Money
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Money Between Categories</DialogTitle>
              <DialogDescription>
                Transfer budget amount from one category to another (same month only)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-category">From Category</Label>
                <Select value={moveFromCategory} onValueChange={setMoveFromCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source category" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.categories
                      .filter(cat => cat.budgeted > 0)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({formatCurrency(category.budgeted)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to-category">To Category</Label>
                <Select value={moveToCategory} onValueChange={setMoveToCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination category" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.categories
                      .filter(cat => cat.id !== moveFromCategory)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMoveMoney}>
                  Move Money
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Table */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Budgets</CardTitle>
            <CardDescription>
              Set and track your monthly budget by category (excluding income categories)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : data.categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
                <p className="text-muted-foreground mb-4">Create categories first to start budgeting.</p>
                <Button asChild>
                  <a href="/categories/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Categories
                  </a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
                        <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className={getGroupColor(group)}>
                              {group}
                            </Badge>
                            <span className="font-medium">{categories.length} categories</span>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Budgeted</div>
                              <span className="font-medium">{formatCurrency(groupTotal?.budgeted || 0)}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Activity</div>
                              <span className="font-medium">{formatCurrency(groupTotal?.activity || 0)}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Available</div>
                              <span className={`font-medium ${getAvailableColor(groupTotal?.available || 0)}`}>
                                {formatCurrency(groupTotal?.available || 0)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm">
                              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="ml-4 space-y-2">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                              <div className="flex items-center space-x-4">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <div>
                                  <div className="font-medium">{category.name}</div>
                                  <Badge variant="outline" className={getGroupColor(category.group)}>
                                    {category.group}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-6">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Budgeted</div>
                                  {editingCategory === category.id ? (
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        ref={editInputRef}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => handleBlur(category.id)}
                                        onKeyDown={(e) => handleKeyDown(e, category.id)}
                                        className="w-24"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span 
                                        className="font-medium cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                        onClick={() => startEditing(category.id, category.budgeted)}
                                      >
                                        {formatCurrency(category.budgeted)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditing(category.id, category.budgeted)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      {category.budgeted > 0 && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteBudget(category.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Activity</div>
                                  <span className="font-medium">{formatCurrency(category.activity)}</span>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Available</div>
                                  <span className={`font-medium ${getAvailableColor(category.available)}`}>
                                    {formatCurrency(category.available)}
                                  </span>
                                </div>

                                {(category.movesIn > 0 || category.movesOut > 0) && (
                                  <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Moves</div>
                                    <div className="flex items-center space-x-1">
                                      {category.movesIn > 0 && (
                                        <span className="text-green-600 text-xs">+{formatCurrency(category.movesIn)}</span>
                                      )}
                                      {category.movesOut > 0 && (
                                        <span className="text-red-600 text-xs">-{formatCurrency(category.movesOut)}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
