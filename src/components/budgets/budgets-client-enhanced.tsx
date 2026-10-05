"use client";
import { useLanguage } from "@/components/language-provider";

import { I18nText } from "@/components/language-provider";
import { IncomePlan } from "./income-plan";
import { CurrencyPicker, usePreferredCurrency } from "@/components/ui/currency-picker";


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
import { formatMoney } from "@/lib/currency";
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
import { getBudgetsForMonth, updateBudget, moveBudgetMoney, deleteBudget, copyMonthlyBudget } from "@/lib/actions/budget-actions";
import { localizedToast as toast } from "@/lib/i18n/client-messages";
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
 const { t: ppT } = useLanguage();

  const [currency, setCurrency] = usePreferredCurrency("budgets");
  const formatCurrency = (amount: number) => formatMoney(amount, currency);
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
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveFromCategory, setMoveFromCategory] = useState<string>("");
  const [moveToCategory, setMoveToCategory] = useState<string>("");
  const [moveAmount, setMoveAmount] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [copying, setCopying] = useState(false);

  function openCopy() {
    const next = new Date(year, Number(month), 1);
    setCopyTarget(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setReplaceExisting(false);
    setCopyOpen(true);
  }

  async function handleCopy() {
    setCopying(true);
    try {
      const result = await copyMonthlyBudget(`${year}-${month.padStart(2, "0")}`, copyTarget, currency, replaceExisting);
      if (!result.success) { toast.error(result.error || "Could not copy budget"); return; }
      toast.success(`Copied ${result.count} category budgets to ${copyTarget} (${currency})`);
      setCopyOpen(false);
      setMonth(String(Number(copyTarget.slice(5))));
      setYear(Number(copyTarget.slice(0, 4)));
    } catch {
      toast.error("Could not copy budget. Please try again.");
    } finally {
      setCopying(false);
    }
  }

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
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getBudgetsForMonth(month, year, currency);
        if (active && result.success && result.data) {
          setData(result.data);

        }
      } catch (error) {
        console.error("Failed to fetch budget data:", error);
        toast.error("Failed to load budget data");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [currency, month, year]);

  // Changing the selected month updates its URL without moving the page.
  // Saving an amount does not trigger navigation or replace the category list.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("month") === month && url.searchParams.get("year") === String(year)) return;
    url.searchParams.set("month", month);
    url.searchParams.set("year", String(year));
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [month, year]);

  // Auto-save on blur
  const handleBlur = (categoryId: string) => {
    if (editingCategory === categoryId) {
      saveEdit(categoryId);
    }
  };

  // Save on Enter key
  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(categoryId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleBudgetUpdate = async (categoryId: string, newAmount: number) => {
    if (savingRef.current) return;
    const category = data.categories.find(cat => cat.id === categoryId);
    if (category?.budgeted === newAmount) { setEditingCategory(null); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await updateBudget(categoryId, month, year, newAmount, currency, false);
      if (!result.success) { toast.error(result.error || "Failed to update budget"); return; }
      const refreshed = await getBudgetsForMonth(month, year, currency);
      if (refreshed.success && refreshed.data) {
        setData(refreshed.data);
      } else {
        const delta = newAmount - (category?.budgeted ?? 0);
        setData(previous => ({ ...previous,
          categories: previous.categories.map(cat => cat.id === categoryId
            ? { ...cat, budgeted: newAmount, budgetId: result.data?.id ?? category?.budgetId ?? null,
                available: newAmount - cat.activity + cat.movesIn - cat.movesOut } : cat),
          totals: { ...previous.totals, budgeted: previous.totals.budgeted + delta,
            available: previous.totals.available + delta, leftToBudget: previous.totals.leftToBudget - delta }
        }));
      }
      setEditingCategory(null);
      toast.success("Budget updated successfully");
    } catch (error) {
      console.error("Failed to update budget:", error);
      toast.error("Failed to update budget");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
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
      const result = await moveBudgetMoney(moveFromCategory, moveToCategory, month, year, amount, currency);
      if (result.success) {
        // Refresh data
        const refreshed = await getBudgetsForMonth(month, year, currency);
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
      const result = await deleteBudget(categoryId, month, year, currency);
      if (result.success) {
        // Refresh data
        const refreshed = await getBudgetsForMonth(month, year, currency);
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
    if (savingRef.current) return;
    setEditingCategory(categoryId);
    setEditValue(currentValue.toString());
    // Focus the input after state update
    setTimeout(() => {
      editInputRef.current?.focus({ preventScroll: true });
      editInputRef.current?.select();
    }, 0);
  };

  const saveEdit = (categoryId: string) => {
    const newAmount = parseFloat(editValue);
    if (Number.isFinite(newAmount) && newAmount >= 0) {
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

  const getGroupHeaderStyle = (group: string) => {
    switch (group) {
      case "NEEDS": return "border-blue-300 border-l-blue-500 bg-blue-50 dark:border-blue-800 dark:border-l-blue-400 dark:bg-blue-950/40";
      case "WANTS": return "border-purple-300 border-l-purple-500 bg-purple-50 dark:border-purple-800 dark:border-l-purple-400 dark:bg-purple-950/40";
      case "SAVINGS": return "border-teal-300 border-l-teal-500 bg-teal-50 dark:border-teal-800 dark:border-l-teal-400 dark:bg-teal-950/40";
      case "DEBT": return "border-red-300 border-l-red-500 bg-red-50 dark:border-red-800 dark:border-l-red-400 dark:bg-red-950/40";
      default: return "border-slate-300 border-l-slate-500 bg-slate-50 dark:border-slate-700 dark:border-l-slate-400 dark:bg-slate-900/60";
    }
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
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <CurrencyPicker remember preferenceKey="budgets" value={currency} disabled={loading || editingCategory !== null} onChange={value => { setLoading(true); setCurrency(value); }} />
      <Button className="w-full md:w-auto" variant="outline" onClick={openCopy} disabled={loading || editingCategory !== null}>{""}<I18nText text={"Copy budget to another month"}/>{""}</Button>
      </div>
      <Dialog open={copyOpen} onOpenChange={open => { if (!copying) setCopyOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{""}<I18nText text={"Copy monthly budget"}/>{""}</DialogTitle>
            <DialogDescription>{""}<I18nText text={"Copy"}/>{" "}{year}-{month.padStart(2, "0")}{" "}<I18nText text={"planned amounts in"}/>{" "}{currency}{" "}<I18nText text={"to another month. You can edit the copied amounts afterward. Spending and money moves stay in their original month."}/>{""}</DialogDescription>
          </DialogHeader>
          <Label htmlFor="copy-budget-month">{""}<I18nText text={"Destination month"}/>{""}</Label>
          <Input id="copy-budget-month" type="month" value={copyTarget} onChange={event => setCopyTarget(event.target.value)} disabled={copying} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={replaceExisting} onChange={event => setReplaceExisting(event.target.checked)} disabled={copying} />{" "}<I18nText text={"Replace existing amounts for matching categories"}/>{" "}</label>
          <Button onClick={handleCopy} disabled={copying || !copyTarget}><I18nText text={copying ? "Copying..." : "Copy budget"}/></Button>
        </DialogContent>
      </Dialog>
      <IncomePlan month={`${year}-${month.padStart(2,"0")}`} currency={currency} received={data.totals.income} budgeted={data.totals.budgeted} loadingBudget={loading} />
      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileBudgets currency={currency}
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
        <h1 className={TYPOGRAPHY.PAGE_TITLE}>{""}<I18nText text={"Budgets"}/>{""}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className={BUTTON.ICON_SPACING}>
            <ChevronUp className="h-4 w-4 rotate-270" />{" "}<I18nText text={"Previous"}/>{" "}</Button>
          
          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={ppT("Month")} />
              </SelectTrigger>
              <SelectContent>
                {months.map((monthName, index) => (
                  <SelectItem key={monthName} value={(index + 1).toString()}>
                    <I18nText text={monthName}/>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder={ppT("Year")} />
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
          
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className={BUTTON.ICON_SPACING}>{" "}<I18nText text={"Next"}/>{" "}<ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={SPACING.MARGIN.SECTION}>
      <div className={LAYOUT.GRID.SUMMARY}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-sm font-medium">{""}<I18nText text={"Income"}/>{""}</CardTitle>
            <ArrowDownUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{formatCurrency(data.totals.income)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-sm font-medium">{""}<I18nText text={"Expenses"}/>{""}</CardTitle>
            <ReceiptText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{formatCurrency(data.totals.expenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-sm font-medium">{""}<I18nText text={"Total Budgeted"}/>{""}</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{formatCurrency(data.totals.budgeted)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-sm font-medium">{""}<I18nText text={"Available"}/>{""}</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-xl font-bold ${getAvailableColor(data.totals.available)}`}>
              {formatCurrency(data.totals.available)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-sm font-medium">{""}<I18nText text={"Left to Budget"}/>{""}</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-xl font-bold ${data.totals.leftToBudget < 0 ? "text-red-600" : "text-green-600"}`}>
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
              <AlertCircle className="h-5 w-5" />{" "}<I18nText text={"Uncategorized Expenses"}/>{" "}</CardTitle>
            <CardDescription className="text-orange-700">{" "}<I18nText text={"You have"}/>{" "}{data.uncategorized.count}{" "}<I18nText text={"uncategorized transactions totaling"}/>{" "}{formatCurrency(data.uncategorized.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Button onClick={handleFixUncategorized} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />{" "}<I18nText text={"Fix Now"}/>{" "}</Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <a href={`/categories/new?returnTo=${encodeURIComponent(`/budgets?month=${month}&year=${year}`)}`} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />{" "}<I18nText text={"Add Category"}/>{" "}</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/categories" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />{" "}<I18nText text={"Manage Categories"}/>{" "}</a>
          </Button>
        </div>
        
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />{" "}<I18nText text={"Move Money"}/>{" "}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{""}<I18nText text={"Move Money Between Categories"}/>{""}</DialogTitle>
              <DialogDescription>{" "}<I18nText text={"Transfer budget amount from one category to another (same month only)"}/>{" "}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-category">{""}<I18nText text={"From Category"}/>{""}</Label>
                <Select value={moveFromCategory} onValueChange={setMoveFromCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={ppT("Select source category")} />
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
                <Label htmlFor="to-category">{""}<I18nText text={"To Category"}/>{""}</Label>
                <Select value={moveToCategory} onValueChange={setMoveToCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={ppT("Select destination category")} />
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
                <Label htmlFor="amount">{""}<I18nText text={"Amount"}/>{""}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={ppT("0.00")}
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>{" "}<I18nText text={"Cancel"}/>{" "}</Button>
                <Button onClick={handleMoveMoney}>{" "}<I18nText text={"Move Money"}/>{" "}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Table */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{""}<I18nText text={"Category Budgets"}/>{""}</CardTitle>
            <CardDescription>{" "}<I18nText text={"Set and track your monthly budget by category (excluding income categories)"}/>{" "}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {loading ? (
              <div className="text-center py-8">{""}<I18nText text={"Loading..."}/>{""}</div>
            ) : data.categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{""}<I18nText text={"No Categories Found"}/>{""}</h3>
                <p className="text-muted-foreground mb-4">{""}<I18nText text={"Create categories first to start budgeting."}/>{""}</p>
                <Button asChild>
                  <a href={`/categories/new?returnTo=${encodeURIComponent(`/budgets?month=${month}&year=${year}`)}`} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />{" "}<I18nText text={"Create Categories"}/>{" "}</a>
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
                        <div className={`flex items-center justify-between p-4 border border-l-4 rounded-lg cursor-pointer shadow-sm transition-colors hover:brightness-95 dark:hover:brightness-110 ${getGroupHeaderStyle(group)}`}>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className={`${getGroupColor(group)} px-3 py-1 text-base font-bold tracking-wide`}>
                              {group}
                            </Badge>
                            <span className="font-medium">{categories.length}{" "}<I18nText text={"categories"}/>{""}</span>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{""}<I18nText text={"Budgeted"}/>{""}</div>
                              <span className="font-medium">{formatCurrency(groupTotal?.budgeted || 0)}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{""}<I18nText text={"Activity"}/>{""}</div>
                              <span className="font-medium">{formatCurrency(groupTotal?.activity || 0)}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{""}<I18nText text={"Available"}/>{""}</div>
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
                        <div className="mt-3 ml-4 space-y-2">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between gap-3 p-2.5 border rounded-lg bg-background">
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
                                  <div className="text-sm text-muted-foreground">{""}<I18nText text={"Budgeted"}/>{""}</div>
                                  {editingCategory === category.id ? (
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        ref={editInputRef}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        disabled={saving}
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
                                        type="button"
                                        disabled={saving}
                                        aria-label={`${ppT("Edit")} ${category.name}`}
                                        className="h-10 w-10 border bg-muted/40"
                                        onClick={() => startEditing(category.id, category.budgeted)}
                                      >
                                        <Edit aria-hidden="true" className="h-4 w-4 text-teal-700 dark:text-teal-400" />
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
                                  <div className="text-sm text-muted-foreground">{""}<I18nText text={"Activity"}/>{""}</div>
                                  <span className="font-medium">{formatCurrency(category.activity)}</span>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">{""}<I18nText text={"Available"}/>{""}</div>
                                  <span className={`font-medium ${getAvailableColor(category.available)}`}>
                                    {formatCurrency(category.available)}
                                  </span>
                                </div>

                                {(category.movesIn > 0 || category.movesOut > 0) && (
                                  <div className="text-center">
                                    <div className="text-sm text-muted-foreground">{""}<I18nText text={"Moves"}/>{""}</div>
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
