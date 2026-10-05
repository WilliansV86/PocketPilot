"use client";
import { useLanguage } from "@/components/language-provider";

import { I18nText } from "@/components/language-provider";
import { CurrencyPicker, usePreferredCurrency } from "@/components/ui/currency-picker";


import { ActionMenuButton } from "@/components/ui/action-menu-button";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getDateRangePreset, statsDateLabel } from "@/lib/stats-date-range";
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
import { formatMoney } from "@/lib/currency";
import { localizedToast as toast } from "@/lib/i18n/client-messages";

interface MoneyOwed {
  id: string;
  personName: string;
  description?: string;
  currency?: string;
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
 const { t: ppT } = useLanguage();

  const [currency, setCurrency] = usePreferredCurrency("money-owed");
  const formatCurrency = (amount: number) => formatMoney(amount, currency);
  const [selectedMoneyOwed, setSelectedMoneyOwed] = useState<MoneyOwed | null>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMoneyOwed, setEditingMoneyOwed] = useState<MoneyOwed | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const openMoneyOwed = moneyOwed.filter(item => (item.currency || "USD") === currency && !item.isArchived && item.status !== "PAID");
  const paidMoneyOwed = moneyOwed.filter(item => (item.currency || "USD") === currency && !item.isArchived && item.status === "PAID");

  const totalOutstanding = openMoneyOwed.reduce((sum, item) => sum + item.amountOutstanding, 0);
  const openCount = openMoneyOwed.filter(item => item.status === "OPEN").length;
  const partialCount = openMoneyOwed.filter(item => item.status === "PARTIAL").length;
  
  // Calculate overdue count
  const today = getDateRangePreset("this_month").end.toISOString().slice(0, 10);
  const isPastDue = (item: MoneyOwed) => !!item.dueDate && new Date(item.dueDate).toISOString().slice(0, 10) < today;
  const overdueCount = openMoneyOwed.filter(isPastDue).length;

  const handleRecordPayment = (moneyOwed: MoneyOwed) => {
    setEditingPayment(null);
    setSelectedMoneyOwed(moneyOwed);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setEditingPayment(null);
    setShowHistoryDialog(false);
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

  const handleUpdate = (savedCurrency?: string) => {
    if (savedCurrency === "USD" || savedCurrency === "CAD") setCurrency(savedCurrency);
    setShowCreateForm(false);
    setEditingMoneyOwed(null);
    onUpdate?.();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingMoneyOwed(null);
  };

  const mobileRecords = (items: MoneyOwed[], paid = false) => <div className="space-y-3 md:hidden">
    {items.map(item => <article key={item.id} aria-label={`Money owed by ${item.personName}`} className="min-w-0 space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-base font-semibold">{item.personName}</h3>{item.description && <p className="mt-1 break-words text-xs text-muted-foreground">{item.description}</p>}</div><Badge variant="outline" className="shrink-0">{item.currency || "USD"}</Badge></div>
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs text-muted-foreground"><I18nText text={paid ? "Repaid" : "Outstanding"}/></p><p className="break-words text-xl font-bold tabular-nums">{formatMoney(paid ? item.amountOriginal : item.amountOutstanding,item.currency)}</p></div><div className="text-right text-xs text-muted-foreground">{""}<I18nText text={"Original"}/>{""}<br /><span className="font-medium tabular-nums">{formatMoney(item.amountOriginal,item.currency)}</span></div></div>
      <div className="flex flex-wrap items-center gap-2 text-xs"><Badge className={statusColors[item.status]}><I18nText text={item.status === "PARTIAL" ? "Partially paid" : item.status === "PAID" ? "Paid" : "Open"}/></Badge>{!paid && item.dueDate && <span className={isPastDue(item) ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}><I18nText text={isPastDue(item) ? "Overdue · " : "Due "}/><I18nText text={statsDateLabel(item.dueDate)}/></span>}{!paid && !item.dueDate && <span className="text-muted-foreground">{""}<I18nText text={"No due date"}/>{""}</span>}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        {!paid ? <Button type="button" size="sm" className="min-h-10" onClick={()=>handleRecordPayment(item)}><DollarSign className="mr-1 h-4 w-4" />{""}<I18nText text={"Record payment"}/>{""}</Button> : <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={()=>handleViewHistory(item)}><Eye className="mr-1 h-4 w-4" />{""}<I18nText text={"Payment history"}/>{""}</Button>}
        <DropdownMenu><DropdownMenuTrigger asChild><ActionMenuButton label={`Actions for ${item.personName}`} /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={()=>handleViewHistory(item)}><Eye className="mr-2 h-4 w-4" />{""}<I18nText text={"Payment history"}/>{""}</DropdownMenuItem><DropdownMenuItem onClick={()=>onEdit ? onEdit(item) : handleEdit(item)}><Edit className="mr-2 h-4 w-4" />{""}<I18nText text={"Edit original amount"}/>{""}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={()=>handleArchive(item)}><Trash2 className="mr-2 h-4 w-4" />{""}<I18nText text={"Delete"}/>{""}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>
    </article>)}
  </div>;

  if (showCreateForm || editingMoneyOwed) {
    return (
      <div className="pp-money-owed-page space-y-4">
      <CurrencyPicker remember compact preferenceKey="money-owed" value={currency} onChange={setCurrency} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>{" "}<I18nText text={"Back to Money Owed"}/>{" "}</Button>
            <h1 className="text-2xl font-bold tracking-tight">
              <I18nText text={editingMoneyOwed ? "Edit Money Owed" : "Create Money Owed"}/>
            </h1>
          </div>
        </div>
        
        <MoneyOwedForm
          mode={editingMoneyOwed ? "edit" : "create"}
          moneyOwed={editingMoneyOwed}
          onCancel={handleCancel}
          defaultCurrency={currency}
          onSuccess={handleUpdate}
        />
      </div>
    );
  }

  return (
    <div className="pp-money-owed-page space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{""}<I18nText text={"Money Owed"}/>{""}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{" "}<I18nText text={"Track balances and payments received"}/>{" "}</p>
        </div>
        <Button onClick={handleCreateMoneyOwed}>
          <DollarSign className="h-4 w-4 mr-2" />{" "}<I18nText text={"Add person"}/>{" "}</Button>
      </div>

      <CurrencyPicker remember compact preferenceKey="money-owed" value={currency} onChange={setCurrency} />

      <SummaryStrip lead items={[
        { label:"Total outstanding",value:formatCurrency(totalOutstanding),detail:`Across ${openMoneyOwed.length} records`,icon:DollarSign },
        { label:"Open",value:openCount,icon:TrendingUp },
        { label:"Partially paid",value:partialCount,icon:AlertCircle,tone:"warning" },
        { label:"Overdue",value:overdueCount,icon:Calendar,tone:overdueCount ? "danger" : "default" },
      ]} />

      {/* Open Money Owed */}
      {openMoneyOwed.length > 0 && <section className="space-y-3 md:hidden" aria-label={ppT("Open money owed")}><h2 className="text-base font-semibold">{""}<I18nText text={"People who owe you"}/>{""}</h2>{mobileRecords(openMoneyOwed)}</section>}
      {openMoneyOwed.length > 0 && (
        <Card className="hidden md:flex">
          <CardHeader>
            <CardTitle>{""}<I18nText text={"Open Money Owed"}/>{""}</CardTitle>
            <CardDescription>{" "}<I18nText text={"Your active receivables and payment status"}/>{" "}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{""}<I18nText text={"Person"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Original"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Outstanding"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Status"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Due Date"}/>{""}</TableHead>
                  <TableHead className="text-right">{""}<I18nText text={"Actions"}/>{""}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openMoneyOwed.map((item) => {
                  const StatusIcon = statusIcons[item.status];
                  const isOverdue = isPastDue(item);
                  
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
                        {formatMoney(item.amountOriginal, item.currency)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(item.amountOutstanding, item.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <I18nText text={item.status}/>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {item.dueDate ? (
                            <>
                              <Calendar className="h-4 w-4" />
                              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                <I18nText text={statsDateLabel(item.dueDate)}/>
                              </span>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">{" "}<I18nText text={"Overdue"}/>{" "}</Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">{""}<I18nText text={"No due date"}/>{""}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ActionMenuButton label={`Actions for ${item.personName}`} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRecordPayment(item)}>
                              <DollarSign className="mr-2 h-4 w-4" />{" "}<I18nText text={"Record Payment"}/>{" "}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(item)}>
                              <Eye className="mr-2 h-4 w-4" />{" "}<I18nText text={"View History"}/>{" "}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit ? onEdit(item) : handleEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />{" "}<I18nText text={"Edit"}/>{" "}</DropdownMenuItem>
                            {item.amountOutstanding === 0 && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(item)}>
                                <CheckCircle className="mr-2 h-4 w-4" />{" "}<I18nText text={"Mark as Paid"}/>{" "}</DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleArchive(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />{" "}<I18nText text={"Delete"}/>{" "}</DropdownMenuItem>
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
      {paidMoneyOwed.length > 0 && <details className="space-y-3 md:hidden"><summary className="cursor-pointer rounded-lg border px-3 py-3 text-sm font-medium">{""}<I18nText text={"Paid records ("}/>{""}{paidMoneyOwed.length})</summary>{mobileRecords(paidMoneyOwed,true)}</details>}
      {paidMoneyOwed.length > 0 && (
        <Card className="hidden md:flex">
          <CardHeader>
            <CardTitle>{""}<I18nText text={"Paid Money Owed"}/>{""}</CardTitle>
            <CardDescription>{" "}<I18nText text={"Completed receivables"}/>{" "}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{""}<I18nText text={"Person"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Original Amount"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Paid Date"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Actions"}/>{""}</TableHead>
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
                      {formatMoney(item.amountOriginal, item.currency)}
                    </TableCell>
                    <TableCell>
                      <I18nText text={format(new Date(item.updatedAt), "MMM dd, yyyy")}/>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <ActionMenuButton label={`Actions for ${item.personName}`} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewHistory(item)}>
                            <Eye className="mr-2 h-4 w-4" />{" "}<I18nText text={"View History"}/>{" "}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleArchive(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />{" "}<I18nText text={"Delete"}/>{" "}</DropdownMenuItem>
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
      {openMoneyOwed.length === 0 && paidMoneyOwed.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{""}<I18nText text={"No money owed records in"}/>{" "}{currency}</h3>
            <p className="text-muted-foreground text-center mb-4">{" "}<I18nText text={"Choose another currency above to check your other records, or add a new one in"}/>{" "}{currency}.
            </p>
            <Button onClick={handleCreateMoneyOwed}>
              <DollarSign className="h-4 w-4 mr-2" />{" "}<I18nText text={"Add Money Owed"}/>{" "}</Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      {selectedMoneyOwed && (
        <MoneyOwedPaymentDialog
          payment={editingPayment}
          moneyOwed={selectedMoneyOwed}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>{""}<I18nText text={"Payment history"}/>{""}</DialogTitle><DialogDescription>{selectedMoneyOwed?.personName} · {selectedMoneyOwed?.payments?.length || 0}{" "}<I18nText text={"payments"}/>{""}</DialogDescription></DialogHeader>
          <div className="space-y-2">{selectedMoneyOwed?.payments?.length ? selectedMoneyOwed.payments.map((payment:any)=><div key={payment.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold tabular-nums">{formatMoney(payment.amount,selectedMoneyOwed.currency)}</p><p className="text-xs text-muted-foreground"><I18nText text={statsDateLabel(payment.date)}/></p></div><Button type="button" variant="outline" size="sm" className="min-h-10" onClick={()=>{setEditingPayment(payment);setShowHistoryDialog(false);setPaymentDialogOpen(true);}}><Edit className="mr-1 h-3 w-3" />{""}<I18nText text={"Edit payment"}/>{""}</Button></div>
            <p className="mt-1 break-words text-xs text-muted-foreground">{payment.accountName}</p>{payment.note && <p className="mt-1 break-words text-xs text-muted-foreground">{payment.note}</p>}
          </div>) : <p className="text-sm text-muted-foreground">{""}<I18nText text={"No payments recorded yet."}/>{""}</p>}</div>
          <Button variant="outline" onClick={()=>setShowHistoryDialog(false)}>{""}<I18nText text={"Close"}/>{""}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
