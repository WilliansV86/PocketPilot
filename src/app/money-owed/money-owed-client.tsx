"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoneyOwedList } from "@/components/money-owed/money-owed-list";
import { MoneyOwedForm } from "@/components/money-owed/money-owed-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getMoneyOwed } from "@/lib/actions/money-owed-actions";
import { archiveMoneyOwed } from "@/lib/actions/money-owed-actions";
import { toast } from "sonner";

type MoneyOwed = {
  id: string;
  personName: string;
  description?: string | null;
  amountOriginal: number;
  amountOutstanding: number;
  dueDate?: Date | null;
  status: "OPEN" | "PARTIAL" | "PAID";
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  payments?: any[];
};

interface MoneyOwedClientProps {
  moneyOwed: MoneyOwed[];
}

export function MoneyOwedClient({ moneyOwed: initialMoneyOwed }: MoneyOwedClientProps) {
  const router = useRouter();
  const [moneyOwed, setMoneyOwed] = useState<MoneyOwed[]>(initialMoneyOwed || []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMoneyOwed, setEditingMoneyOwed] = useState<MoneyOwed | null>(null);

  const refreshMoneyOwed = async () => {
    try {
      const result = await getMoneyOwed();
      if (result.success) {
        setMoneyOwed(result.data || []);
      }
    } catch (error) {
      console.error("Failed to refresh money owed:", error);
    }
  };

  const handleCreateMoneyOwed = () => {
    setShowCreateForm(true);
    setEditingMoneyOwed(null);
  };

  const handleEditMoneyOwed = (moneyOwed: MoneyOwed) => {
    setEditingMoneyOwed(moneyOwed);
    setShowCreateForm(false);
  };

  const handleDeleteMoneyOwed = async (moneyOwed: MoneyOwed) => {
    if (!confirm(`Are you sure you want to archive "${moneyOwed.personName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await archiveMoneyOwed(moneyOwed.id);
      if (result.success) {
        toast.success(result.message || "Money owed record archived successfully");
        // Update local state immediately
        setMoneyOwed(prev => prev.filter(m => m.id !== moneyOwed.id));
        // Also refresh server data
        router.refresh();
      } else {
        toast.error(result.error || "Failed to archive money owed record");
      }
    } catch (error) {
      toast.error("Failed to archive money owed record");
    }
  };

  const handleUpdate = async () => {
    // Refresh the money owed list from server
    await refreshMoneyOwed();
    router.refresh();
  };

  const handleFormSuccess = () => {
    // Reset form state
    setShowCreateForm(false);
    setEditingMoneyOwed(null);
    // Refresh data
    handleUpdate();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingMoneyOwed(null);
  };

  if (showCreateForm || editingMoneyOwed) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Money Owed
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingMoneyOwed ? "Edit Money Owed" : "Create Money Owed"}
            </h1>
          </div>
        </div>
        
        <MoneyOwedForm
          mode={editingMoneyOwed ? "edit" : "create"}
          moneyOwed={editingMoneyOwed}
          onCancel={handleCancel}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MoneyOwedList
        moneyOwed={moneyOwed as any}
        onEdit={handleEditMoneyOwed as any}
        onDelete={handleDeleteMoneyOwed as any}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
