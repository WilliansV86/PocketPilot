"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownUp, Wallet, ReceiptText, Target, ArrowRightLeft, Edit, Trash2, Plus, Settings } from "lucide-react";
import { getBudgetsForMonth, updateBudget, moveBudgetMoney, deleteBudget } from "@/lib/actions/budget-actions";
import { toast } from "sonner";

type BudgetCategory = {
  id: string;
  name: string;
  group: string;
  color: string;
  icon: string;
  budgeted: number;
  activity: number;
  available: number;
  budgetId: string | null;
};

type BudgetData = {
  categories: BudgetCategory[];
  totals: {
    income: number;
    expenses: number;
    budgeted: number;
    available: number;
    leftToBudget: number;
  };
};

interface BudgetsClientProps {
  initialData: BudgetData;
  initialMonth: string;
  initialYear: number;
}

export function BudgetsClient({ initialData, initialMonth, initialYear }: BudgetsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BudgetData>(initialData);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveFromCategory, setMoveFromCategory] = useState<string>("");
  const [moveToCategory, setMoveToCategory] = useState<string>("");
  const [moveAmount, setMoveAmount] = useState("");

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year and 2 years back/forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Fetch data when month/year changes
  useEffect(() => {
    const fetchData = async () => {
      if (month !== initialMonth || year !== initialYear) {
        setLoading(true);
        try {
          const result = await getBudgetsForMonth(month, year);
          if (result.success && result.data) {
            setData(result.data);
            // Update URL
            const params = new URLSearchParams(searchParams);
            params.set('month', month);
            params.set('year', year.toString());
            router.push(`/budgets?${params.toString()}`);
          }
        } catch (error) {
          console.error("Failed to fetch budget data:", error);
          toast.error("Failed to load budget data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [month, year, initialMonth, initialYear, searchParams, router]);

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

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <div className="flex items-center space-x-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[120px]">
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
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                Transfer budget amount from one category to another
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
                No categories found. Create some categories first.
              </div>
            ) : (
              <div className="space-y-4">
                {data.categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => saveEdit(category.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{formatCurrency(category.budgeted)}</span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
