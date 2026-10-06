"use client";
import { useLanguage } from "@/components/language-provider";


import { I18nText } from "@/components/language-provider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DebtList } from "@/components/debts/debt-list";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney as formatCurrency } from "@/lib/currency";
import { 
  Plus, 
  ArrowLeft, 
  CreditCard, 
  DollarSign,
  TrendingDown,
  Clock,
  Bell,
  FileText,
} from "lucide-react";
import { deleteDebt, getDebts, getDebtSummary, makeDebtPayment } from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/account-actions";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

type Debt = {
  id: string;
  name: string;
  type: string;
  lender: string | null;
  originalAmount: number | null;
  currency?: string;
  currentBalance: number;
  interestRateAPR: number | null;
  minimumPayment: number | null;
  dueDayOfMonth: number | null;
  creditLimit: number | null;
  statementClosingDay: number | null;
  minimumPaymentPaid: number;
  minimumPaymentRemaining: number | null;
  nextDueDate: string | null;
  nextStatementClosingDate: string | null;
  notes: string | null;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface DebtsClientProps {
  debts: Debt[] | undefined;
}

export function DebtsClientEnhanced({ debts: initialDebts }: DebtsClientProps) {
 const { t: ppT } = useLanguage();

  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>(initialDebts || []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalsByCurrency: [],
    totalBalance: 0,
    totalMinimumPayments: 0,
    openDebtCount: 0,
    nextDuePayments: [],
    upcomingReminders: [],
  });

  useEffect(() => {
    loadSummary();
    loadAccounts();
  }, []);

  const refreshDebts = async () => {
    try {
      const result = await getDebts();
      if (result.success) {
        setDebts(result.data || []);
        await loadSummary(); // Refresh summary after debts update
      }
    } catch (error) {
      console.error("Failed to refresh debts:", error);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await getDebtSummary();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error("Failed to load debt summary:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await getAccounts();
      if (result.success) {
        console.log("loadAccounts - setting accounts:", result.data);
        setAccounts(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const handleCreateDebt = () => {
    console.log("handleCreateDebt - setting showCreateForm to true");
    setShowCreateForm(true);
    setEditingDebt(null);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setShowCreateForm(false);
  };

  const handleDeleteDebt = async (debt: Debt) => {
    if (!confirm(`Are you sure you want to delete "${debt.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteDebt(debt.id);
      if (result.success) {
        toast.success(result.message || "Debt deleted successfully");
        // Update local state immediately
        setDebts(prev => prev.filter(d => d.id !== debt.id));
        // Also refresh server data
        await refreshDebts();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete debt");
      }
    } catch (error) {
      toast.error("Failed to delete debt");
    }
  };

  const handleUpdate = async () => {
    // Refresh the debts list from server
    await refreshDebts();
    router.refresh();
  };

  const handleFormSuccess = () => {
    // Reset form state
    setShowCreateForm(false);
    setEditingDebt(null);
    // Refresh data
    handleUpdate();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingDebt(null);
  };

  const handleMakePayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.minimumPayment?.toString() || "");
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedDebt || !paymentAmount || !selectedAccount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (amount > selectedDebt.currentBalance) {
      toast.error("Payment amount cannot exceed current balance");
      return;
    }

    try {
      const result = await makeDebtPayment(
        selectedDebt.id,
        amount,
        paymentDate,
        selectedAccount
      );

      if (result.success) {
        toast.success(result.message);
        setPaymentDialogOpen(false);
        setSelectedDebt(null);
        setPaymentAmount("");
        setSelectedAccount("");
        // Refresh all data
        await refreshDebts();
        await loadAccounts();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to process payment");
      }
    } catch (error) {
      toast.error("Failed to process payment");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (showCreateForm || editingDebt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />{" "}<I18nText text={"Back to Debts"}/>{" "}</Button>
            <h1 className="text-3xl font-bold tracking-tight">
              <I18nText text={editingDebt ? "Edit Debt" : "Create New Debt"}/>
            </h1>
          </div>
        </div>
        
        <DebtForm
          mode={editingDebt ? "edit" : "create"}
          debt={editingDebt}
          onCancel={handleCancel}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{""}<I18nText text={"Debts"}/>{""}</h1>
          <p className="text-muted-foreground">{" "}<I18nText text={"Track and manage your debts, payments, and progress"}/>{" "}</p>
        </div>
        {debts.length > 0 && (
          <Button onClick={handleCreateDebt}>
            <Plus className="h-4 w-4 mr-2" />{" "}<I18nText text={"Add Debt"}/>{" "}</Button>
        )}
      </div>

      {/* Summary Cards - Simplified to 3 cards to eliminate redundancy */}
      {debts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-sm font-medium">{""}<I18nText text={"Total Debt"}/>{""}</CardTitle>
              <CreditCard className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold text-red-600">
                {(summary.totalsByCurrency || []).map((total: any) => <div key={total.currency}>{formatCurrency(total.totalBalance, total.currency)}</div>)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.openDebtCount}{" "}<I18nText text={"active debts"}/>{" "}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-sm font-medium">{""}<I18nText text={"Monthly Minimums"}/>{""}</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold text-orange-600">
                {(summary.totalsByCurrency || []).map((total: any) => <div key={total.currency}>{formatCurrency(total.totalMinimumPayments, total.currency)}</div>)}
              </div>
              <p className="text-xs text-muted-foreground">{" "}<I18nText text={"Total minimum payments"}/>{" "}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-sm font-medium">{""}<I18nText text={"Payment Progress"}/>{""}</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold text-green-600">
                {debts.length > 0 
                  ? Math.round((debts.filter(d => d.isClosed).length / debts.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.nextDuePayments.length > 0 
                  ? `${debts.filter(d => d.isClosed).length} of ${debts.length} paid off • Next: ${formatDate(summary.nextDuePayments[0].dueDate)}`
                  : `${debts.filter(d => d.isClosed).length} of ${debts.length} paid off`
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-0 p-3 pb-1"><CardTitle className="text-sm font-medium">{""}<I18nText text={"Average APR"}/>{""}</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold">{(() => { const open = debts.filter(debt => !debt.isClosed); return open.length ? (open.reduce((sum, debt) => sum + (debt.interestRateAPR || 0), 0) / open.length).toFixed(2) : "0.00"; })()}%</div>
              <p className="text-xs text-muted-foreground">{""}<I18nText text={"Across open debts"}/>{""}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-0 p-3 pb-1"><CardTitle className="text-sm font-medium">{""}<I18nText text={"Closed Debts"}/>{""}</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0"><div className="text-lg font-bold text-green-600">{debts.filter(debt => debt.isClosed).length}</div><p className="text-xs text-muted-foreground">{""}<I18nText text={"Paid off"}/>{""}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {debts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{""}<I18nText text={"No Debts Yet"}/>{""}</h3>
            <p className="text-muted-foreground text-center mb-4">{" "}<I18nText text={"Start tracking your debts to see payment progress and due dates."}/>{" "}</p>
            <Button onClick={handleCreateDebt}>
              <Plus className="h-4 w-4 mr-2" />{" "}<I18nText text={"Add Your First Debt"}/>{" "}</Button>
          </CardContent>
        </Card>
      )}

      {/* Debt List */}
      {debts.length > 0 && (
        <DebtList
          debts={debts as any}
          onEdit={handleEditDebt as any}
          onDelete={handleDeleteDebt as any}
          onUpdate={handleUpdate}
          onMakePayment={handleMakePayment as any}
        />
      )}

      {/* Reminder Center */}
      {summary.upcomingReminders.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />{" "}<I18nText text={"Reminder Center"}/>{" "}</CardTitle>
            <CardDescription>{" "}<I18nText text={"Red: payment within 3 days · Amber: within 7 days · Blue: statement closing soon"}/>{" "}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-2 lg:grid-cols-2">
              {summary.upcomingReminders.map((reminder: any) => {
                const payment = reminder.kind === "PAYMENT_DUE";
                const urgent = payment && reminder.daysUntil <= 3;
                const soon = payment && reminder.daysUntil > 3 && reminder.daysUntil <= 7;
                const closingSoon = !payment && reminder.daysUntil <= 3;
                const rowStyle = urgent ? "border-red-500/60 border-l-red-500 bg-red-500/10" : soon ? "border-amber-500/50 border-l-amber-500 bg-amber-500/10" : closingSoon ? "border-blue-500/50 border-l-blue-500 bg-blue-500/10" : "border-border border-l-muted-foreground/30";
                const alertStyle = urgent ? "bg-red-500 text-white" : soon ? "bg-amber-400 text-black" : closingSoon ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground";
                const timing = reminder.daysUntil === 0 ? (payment ? "Due today" : "Closes today") : reminder.daysUntil === 1 ? (payment ? "Due tomorrow" : "Closes tomorrow") : `${reminder.daysUntil} days ${payment ? "to pay" : "to closing"}`;
                return (
                  <div key={reminder.id} className={`flex min-w-0 items-start justify-between gap-2 rounded-lg border border-l-4 p-3 ${rowStyle}`}>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {payment ? <Clock className={`h-4 w-4 shrink-0 ${urgent ? "text-red-500" : soon ? "text-amber-500" : "text-muted-foreground"}`} /> : <FileText className="h-4 w-4 shrink-0 text-blue-500" />}
                        <div className="text-sm font-medium break-words">{reminder.name}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${alertStyle}`}>{timing}</span>
                        <span className="text-xs text-muted-foreground"><I18nText text={payment ? "Payment" : "Statement"}/> · {formatDate(reminder.date)}</span>
                      </div>
                    </div>
                    <div className="max-w-[180px] shrink-0 text-right">
                      {payment ? reminder.amount > 0 ? <><div className={`text-sm font-semibold ${urgent ? "text-red-500" : soon ? "text-amber-500" : "text-foreground"}`}>{formatCurrency(reminder.amount, reminder.currency)}</div><div className="text-xs text-muted-foreground">{""}<I18nText text={"Minimum remaining"}/>{""}</div></> : <div className="text-xs font-medium">{""}<I18nText text={"Check minimum amount"}/>{""}</div> : <div className="text-xs text-muted-foreground">{reminder.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{""}<I18nText text={"Make Debt Payment"}/>{""}</DialogTitle>
            <DialogDescription>{" "}<I18nText text={"Record a payment for"}/>{" "}{selectedDebt?.name}
            </DialogDescription>
            {selectedDebt?.type === "CREDIT_CARD" && <p className="text-xs text-muted-foreground"><I18nText text="This payment is a transfer. It uses your credit card payment reserve in Budgets, without counting as another expense."/></p>}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-amount">{""}<I18nText text={"Payment Amount"}/>{""}</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={selectedDebt?.currentBalance}
                placeholder={ppT("0.00")}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">{" "}<I18nText text={"Current balance:"}/>{" "}{selectedDebt ? formatCurrency(selectedDebt.currentBalance, selectedDebt.currency) : "N/A"}
              </p>
            </div>
            
            <div>
              <Label htmlFor="payment-date">{""}<I18nText text={"Payment Date"}/>{""}</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payment-account">{""}<I18nText text={"Payment Account"}/>{""}</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder={ppT("Select account")} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(account => account.currency === (selectedDebt?.currency || "USD")).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(Number(account.balance), account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>{" "}<I18nText text={"Cancel"}/>{" "}</Button>
              <Button onClick={handlePaymentSubmit}>{" "}<I18nText text={"Make Payment"}/>{" "}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
