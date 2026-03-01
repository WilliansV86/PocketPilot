"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DebtList } from "@/components/debts/debt-list";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { deleteDebt, getDebts } from "@/lib/actions/debt-actions";
import { toast } from "sonner";

type Debt = {
  id: string;
  name: string;
  type: string;
  lender?: string;
  originalAmount?: number;
  currentBalance: number;
  interestRateAPR?: number;
  minimumPayment?: number;
  dueDayOfMonth?: number;
  notes?: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
};

interface DebtsClientProps {
  debts: Debt[];
}

export function DebtsClient({ debts: initialDebts }: DebtsClientProps) {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const refreshDebts = async () => {
    try {
      const result = await getDebts();
      if (result.success && result.data) {
        setDebts(result.data as unknown as Debt[]);
      }
    } catch (error) {
      console.error("Failed to refresh debts:", error);
    }
  };

  const handleCreateDebt = () => {
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
        <Button onClick={handleCreateDebt}>
          <Plus className="h-4 w-4 mr-2" />
          Add Debt
        </Button>
      </div>

      <DebtList
        debts={debts}
        onEdit={handleEditDebt}
        onDelete={handleDeleteDebt}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
