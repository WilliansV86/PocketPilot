"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoneyOwedPaymentDialog } from "./money-owed-payment-dialog";
import { MoneyOwedForm } from "./money-owed-form";
import { archiveMoneyOwed, deleteMoneyOwed, markMoneyOwedAsPaid } from "@/lib/actions/money-owed-actions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface MoneyOwed {
  id: string;
  personName: string;
  description?: string;
  amountOriginal: number;
  amountOutstanding: number;
  dueDate?: string;
  status: "OPEN" | "PARTIAL" | "PAID";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  payments?: any[];
}

interface MoneyOwedListProps {
  moneyOwed: MoneyOwed[];
  onEdit?: (moneyOwed: MoneyOwed) => void;
  onDelete?: (moneyOwed: MoneyOwed) => void;
  onUpdate?: () => void;
}

const statusColors = {
  OPEN: "bg-blue-100 text-blue-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
};

const statusIcons = {
  OPEN: DollarSign,
  PARTIAL: AlertCircle,
  PAID: CheckCircle,
};

export function MoneyOwedList({ moneyOwed, onEdit, onDelete, onUpdate }: MoneyOwedListProps) {
  const [selectedMoneyOwed, setSelectedMoneyOwed] = useState<MoneyOwed | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMoneyOwed, setEditingMoneyOwed] = useState<MoneyOwed | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const openMoneyOwed = moneyOwed.filter(item => !item.isArchived && item.status !== "PAID");
  const paidMoneyOwed = moneyOwed.filter(item => !item.isArchived && item.status === "PAID");

  const totalOutstanding = openMoneyOwed.reduce((sum, item) => sum + item.amountOutstanding, 0);
  const openCount = openMoneyOwed.filter(item => item.status === "OPEN").length;
  const partialCount = openMoneyOwed.filter(item => item.status === "PARTIAL").length;
  
  // Calculate overdue count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = openMoneyOwed.filter(item => 
    item.dueDate && new Date(item.dueDate) < today
  ).length;

  const handleRecordPayment = (moneyOwed: MoneyOwed) => {
    setSelectedMoneyOwed(moneyOwed);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setSelectedMoneyOwed(null);
    onUpdate?.();
  };

  const handleEdit = (moneyOwed: MoneyOwed) => {
    setEditingMoneyOwed(moneyOwed);
    setShowCreateForm(false);
  };

  const handleArchive = async (moneyOwed: MoneyOwed) => {
    const confirmMessage = `Are you sure you want to delete "${moneyOwed.personName}"? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Try regular archive first (preserves data if possible)
      const result = await archiveMoneyOwed(moneyOwed.id);
      
      if (result.success) {
        toast.success(result.message || "Money owed record deleted successfully");
        onUpdate?.();
      } else {
        // If archive fails because of payments, offer force delete
        if (result.error?.includes("existing payments")) {
          const forceDelete = confirm(
            `This record has existing payments. Deleting it will permanently remove all payment history. Do you want to proceed with permanent deletion?`
          );
          
          if (forceDelete) {
            const deleteResult = await deleteMoneyOwed(moneyOwed.id);
            if (deleteResult.success) {
              toast.success(deleteResult.message || "Money owed record deleted permanently");
              onUpdate?.();
            } else {
              toast.error(deleteResult.error || "Failed to delete money owed record");
            }
          }
        } else {
          toast.error(result.error || "Failed to delete money owed record");
        }
      }
    } catch (error) {
      toast.error("Failed to delete money owed record");
    }
  };

  const handleMarkAsPaid = async (moneyOwed: MoneyOwed) => {
    try {
      const result = await markMoneyOwedAsPaid(moneyOwed.id);
      if (result.success) {
        toast.success(result.message || "Money owed record marked as paid");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to mark money owed as paid");
      }
    } catch (error) {
      toast.error("Failed to mark money owed as paid");
    }
  };

  const handleViewHistory = (moneyOwed: MoneyOwed) => {
    setSelectedMoneyOwed(moneyOwed);
    setShowHistoryDialog(true);
  };

  const handleCreateMoneyOwed = () => {
    setShowCreateForm(true);
    setEditingMoneyOwed(null);
  };

  const handleUpdate = () => {
    setShowCreateForm(false);
    setEditingMoneyOwed(null);
    onUpdate?.();
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
          onSuccess={handleUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Money Owed</h1>
          <p className="text-muted-foreground">
            Track money owed to you and manage incoming payments
          </p>
        </div>
        <Button onClick={handleCreateMoneyOwed}>
          <DollarSign className="h-4 w-4 mr-2" />
          Add Money Owed
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Across {openCount + partialCount} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Records</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openCount}</div>
            <p className="text-xs text-muted-foreground">No payments received yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{partialCount}</div>
            <p className="text-xs text-muted-foreground">Some payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Money Owed */}
      {openMoneyOwed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Money Owed</CardTitle>
            <CardDescription>
              Your active receivables and payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openMoneyOwed.map((item) => {
                  const StatusIcon = statusIcons[item.status];
                  const isOverdue = item.dueDate && new Date(item.dueDate) < today;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{item.personName}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.amountOriginal)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.amountOutstanding)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {item.dueDate ? (
                            <>
                              <Calendar className="h-4 w-4" />
                              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                {format(new Date(item.dueDate), "MMM dd, yyyy")}
                              </span>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">No due date</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRecordPayment(item)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit?.(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {item.amountOutstanding === 0 && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(item)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleArchive(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Paid Money Owed */}
      {paidMoneyOwed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paid Money Owed</CardTitle>
            <CardDescription>
              Completed receivables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidMoneyOwed.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{item.personName}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.amountOriginal)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.updatedAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewHistory(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleArchive(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {moneyOwed.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No money owed records yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking money owed to you to see your receivables and manage incoming payments.
            </p>
            <Button onClick={handleCreateMoneyOwed}>
              <DollarSign className="h-4 w-4 mr-2" />
              Add Money Owed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      {selectedMoneyOwed && (
        <MoneyOwedPaymentDialog
          moneyOwed={selectedMoneyOwed}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Simple History Dialog - Placeholder for now */}
      {showHistoryDialog && selectedMoneyOwed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            <p className="text-muted-foreground mb-4">
              {selectedMoneyOwed.personName} - {selectedMoneyOwed.payments?.length || 0} payments
            </p>
            <div className="space-y-2 mb-4">
              {selectedMoneyOwed.payments?.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(payment.date), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{payment.accountName}</div>
                    {payment.note && (
                      <div className="text-xs text-muted-foreground">{payment.note}</div>
                    )}
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">No payments recorded yet</p>
              )}
            </div>
            <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
