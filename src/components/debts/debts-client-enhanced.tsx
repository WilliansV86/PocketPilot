"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DebtList } from "@/components/debts/debt-list";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { 
  Plus, 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  TrendingDown,
  Clock
} from "lucide-react";
import { deleteDebt, getDebts, getDebtSummary, makeDebtPayment, type DebtFormValues } from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/account-actions";
import { toast } from "sonner";

type Debt = {
  id: string;
  name: string;
  type: string;
  lender: string | null;
  originalAmount: number | null;
  currentBalance: number;
  interestRateAPR: number | null;
  minimumPayment: number | null;
  dueDayOfMonth: number | null;
  notes: string | null;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface DebtsClientProps {
  debts: Debt[] | undefined;
}

export function DebtsClientEnhanced({ debts: initialDebts }: DebtsClientProps) {
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
    totalBalance: 0,
    totalMinimumPayments: 0,
    openDebtCount: 0,
    nextDuePayments: [],
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

  const getDebtTypeColor = (type: string) => {
    const colors = {
      CREDIT_CARD: "#3b82f6",
      PERSONAL_LOAN: "#10b981", 
      AUTO_LOAN: "#f59e0b",
      MORTGAGE: "#8b5cf6",
      STUDENT_LOAN: "#ec4899",
      MEDICAL: "#ef4444",
      OTHER: "#6b7280",
    };
    return colors[type as keyof typeof colors] || "#6b7280";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (showCreateForm || editingDebt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Debts
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingDebt ? "Edit Debt" : "Create New Debt"}
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
          <h1 className="text-3xl font-bold tracking-tight">Debts</h1>
          <p className="text-muted-foreground">
            Track and manage your debts, payments, and progress
          </p>
        </div>
        {debts.length > 0 && (
          <Button onClick={handleCreateDebt}>
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        )}
      </div>

      {/* Summary Cards - Simplified to 3 cards to eliminate redundancy */}
      {debts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <CreditCard className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.openDebtCount} active debts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Minimums</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalMinimumPayments)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total minimum payments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Payment Progress</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
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
        </div>
      )}

      {/* Empty State */}
      {debts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Debts Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your debts to see payment progress and due dates.
            </p>
            <Button onClick={handleCreateDebt}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Debt
            </Button>
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

      {/* Next Due Payments */}
      {summary.nextDuePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Payments
            </CardTitle>
            <CardDescription>
              Next 5 debt payments due
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.nextDuePayments.map((payment: any, index: number) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getDebtTypeColor(payment.type) }}
                    />
                    <div>
                      <div className="font-medium">{payment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.lender && `${payment.lender} • `}
                        Due {formatDate(payment.dueDate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">
                      {formatCurrency(payment.minimumPayment)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(payment.currentBalance)} remaining
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Debt Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedDebt?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={selectedDebt?.currentBalance}
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current balance: {selectedDebt ? formatCurrency(selectedDebt.currentBalance) : "N/A"}
              </p>
            </div>
            
            <div>
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payment-account">Payment Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(Number(account.balance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePaymentSubmit}>
                Make Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
