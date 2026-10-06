"use client";


import { I18nText } from "@/components/language-provider";
import { ActionMenuButton } from "@/components/ui/action-menu-button";
import { useState } from "react";
import { format } from "date-fns";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Percent, 
  Edit, 
  Trash2, 
  TrendingDown,
  AlertCircle,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { DebtPaymentDialogSimple } from "./debt-payment-dialog-simple";
import { formatMoney as formatCurrency } from "@/lib/currency";

interface Debt {
  id: string;
  name: string;
  type: string;
  lender?: string;
  originalAmount?: number;
  currency?: string;
  currentBalance: number;
  interestRateAPR?: number;
  minimumPayment?: number;
  dueDayOfMonth?: number;
  creditLimit?: number;
  statementClosingDay?: number;
  minimumPaymentPaid?: number;
  minimumPaymentRemaining?: number;
  nextDueDate?: string;
  nextStatementClosingDate?: string;
  notes?: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DebtListProps {
  debts: Debt[];
  onEdit?: (debt: Debt) => void;
  onDelete?: (debt: Debt) => void;
  onUpdate?: () => void;
  onMakePayment?: (debt: Debt) => void;
}

const debtTypeIcons = {
  CREDIT_CARD: CreditCard,
  PERSONAL_LOAN: DollarSign,
  AUTO_LOAN: TrendingDown,
  MORTGAGE: DollarSign,
  STUDENT_LOAN: DollarSign,
  MEDICAL: AlertCircle,
  OTHER: DollarSign,
};

const debtTypeColors = {
  CREDIT_CARD: "bg-blue-100 text-blue-800",
  PERSONAL_LOAN: "bg-green-100 text-green-800",
  AUTO_LOAN: "bg-purple-100 text-purple-800",
  MORTGAGE: "bg-orange-100 text-orange-800",
  STUDENT_LOAN: "bg-indigo-100 text-indigo-800",
  MEDICAL: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function DebtList({ debts, onEdit, onDelete, onUpdate, onMakePayment }: DebtListProps) {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const openDebtList = debts.filter(debt => !debt.isClosed);
  const closedDebtList = debts.filter(debt => debt.isClosed);

  const totalBalance = openDebtList.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalMinimumPayments = openDebtList.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);

  const handlePayment = (debt: Debt) => {
    if (onMakePayment) {
      onMakePayment(debt);
    } else {
      console.log("Payment button clicked for debt:", debt.name);
      setSelectedDebt(debt);
      setPaymentDialogOpen(true);
      console.log("Payment dialog should be open now");
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setSelectedDebt(null);
    onUpdate?.();
  };

  const getProgressPercentage = (debt: Debt) => {
    if (!debt.originalAmount || debt.originalAmount <= 0) return 0;
    const paid = debt.originalAmount - debt.currentBalance;
    return Math.max(0, Math.min((paid / debt.originalAmount) * 100, 100));
  };

  const getUtilizationPercentage = (debt: Debt) => {
    if (!debt.creditLimit || debt.creditLimit <= 0) return 0;
    return Math.min((debt.currentBalance / debt.creditLimit) * 100, 100);
  };

  const formatDateOnly = (date?: string) => {
    if (!date) return null;
    return format(new Date(`${date}T12:00:00`), "MMM d");
  };

  return (
    <div className="space-y-6">
      {/* Open debts grouped by currency for a clear U.S. / Canada overview. */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {[{ currency: "USD", title: "U.S. debts", accent: "border-t-blue-500" }, { currency: "CAD", title: "Canada debts", accent: "border-t-red-500" }].map(group => {
          const countryDebts = openDebtList.filter(debt => (debt.currency || "USD") === group.currency);
          const balance = countryDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
          const minimums = countryDebts.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0);
          return (
            <Card key={group.currency} className={`min-w-0 border-t-4 ${group.accent}`}>
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle><I18nText text={group.title}/></CardTitle>
                  <Badge variant="outline">{group.currency}</Badge>
                </div>
                <CardDescription>{countryDebts.length}{" "}<I18nText text={"open"}/>{" "}<I18nText text={countryDebts.length === 1 ? "debt" : "debts"}/></CardDescription>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><div className="text-xs text-muted-foreground">{""}<I18nText text={"Total balance"}/>{""}</div><div className="text-lg font-semibold">{formatCurrency(balance, group.currency)}</div></div>
                  <div><div className="text-xs text-muted-foreground">{""}<I18nText text={"Monthly minimums"}/>{""}</div><div className="text-lg font-semibold">{formatCurrency(minimums, group.currency)}</div></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {countryDebts.length === 0 && <p className="py-4 text-sm text-muted-foreground">{""}<I18nText text={"No open debts in"}/>{" "}{group.currency}.</p>}
                {countryDebts.map(debt => {
                  const Icon = debtTypeIcons[debt.type as keyof typeof debtTypeIcons] || DollarSign;
                  const utilization = getUtilizationPercentage(debt);
                  const progress = getProgressPercentage(debt);
                  return (
                    <div key={debt.id} className="rounded-lg border bg-background p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <Icon className="mt-1 h-4 w-4 shrink-0" />
                          <div className="min-w-0"><div className="font-medium break-words">{debt.name}</div><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{debt.lender && <span>{debt.lender}</span>}<span>{debt.type.replace("_", " ")}</span></div></div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><ActionMenuButton label={`Actions for ${debt.name}`} /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePayment(debt)}><TrendingDown className="mr-2 h-4 w-4" />{""}<I18nText text={"Make Payment"}/>{""}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit?.(debt)}><Edit className="mr-2 h-4 w-4" />{""}<I18nText text={"Edit"}/>{""}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete?.(debt)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />{""}<I18nText text={"Delete"}/>{""}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div><div className="text-xs text-muted-foreground">{""}<I18nText text={"Balance"}/>{""}</div><div className="font-semibold">{formatCurrency(debt.currentBalance, group.currency)}</div></div>
                        <div><div className="text-xs text-muted-foreground">{""}<I18nText text={"Minimum payment"}/>{""}</div>
                          {debt.minimumPayment ? <><div className="font-medium">{formatCurrency(debt.minimumPayment, group.currency)}</div><div className={`text-xs ${(debt.minimumPaymentRemaining || 0) <= 0 ? "text-green-600" : "text-muted-foreground"}`}><I18nText text={(debt.minimumPaymentRemaining || 0) <= 0 ? "Minimum paid" : `${formatCurrency(debt.minimumPaymentRemaining || 0, group.currency)} remaining`}/></div></> : <div>—</div>}
                        </div>
                      {debt.type === "CREDIT_CARD" && debt.creditLimit ? <div className="col-span-2 space-y-1 sm:col-span-1">
                        <div className="text-xs text-muted-foreground">{""}<I18nText text={"Utilization"}/>{""}</div>
                        <Progress value={utilization} className={`h-1.5 ${utilization > 30 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`} />
                        <div className={`text-xs ${utilization > 30 ? "text-red-500" : "text-green-500"}`}>{utilization.toFixed(1)}{""}<I18nText text={"% of"}/>{" "}{formatCurrency(debt.creditLimit, group.currency)}</div>
                      </div> : debt.type !== "CREDIT_CARD" && debt.originalAmount && debt.originalAmount > 0 ? <div className="col-span-2 space-y-1 sm:col-span-1"><div className="text-xs text-muted-foreground">{""}<I18nText text={"Loan repayment progress"}/>{""}</div><Progress value={progress} className="h-1.5" /><div className="text-xs text-muted-foreground">{progress.toFixed(1)}% <I18nText text="of original balance reduced"/></div></div> : debt.type !== "CREDIT_CARD" ? <div className="col-span-2 text-xs text-muted-foreground sm:col-span-1"><I18nText text="Enter the original debt amount to show repayment progress."/></div> : null}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs">
                        {debt.nextDueDate && <span>{""}<I18nText text={"Due"}/>{" "}{formatDateOnly(debt.nextDueDate)}</span>}
                        {debt.type === "CREDIT_CARD" && debt.nextStatementClosingDate && <span className="text-muted-foreground">{""}<I18nText text={"Closes"}/>{" "}{formatDateOnly(debt.nextStatementClosingDate)}</span>}
                        {!debt.nextDueDate && !debt.nextStatementClosingDate && <span className="text-muted-foreground">{""}<I18nText text={"No dates entered"}/>{""}</span>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Closed Debts */}
      {closedDebtList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{""}<I18nText text={"Closed Debts"}/>{""}</CardTitle>
            <CardDescription>{" "}<I18nText text={"Debts and cards marked closed"}/>{" "}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{""}<I18nText text={"Name"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Type"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Final Balance"}/>{""}</TableHead>
                  <TableHead>{""}<I18nText text={"Closed Date"}/>{""}</TableHead>
                  <TableHead className="text-right">{""}<I18nText text={"Actions"}/>{""}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedDebtList.map((debt) => {
                  const Icon = debtTypeIcons[debt.type as keyof typeof debtTypeIcons] || DollarSign;
                  
                  return (
                    <TableRow key={debt.id} className="opacity-60">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{debt.name}</div>
                            {debt.lender && (
                              <div className="text-sm text-muted-foreground">{debt.lender}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={debtTypeColors[debt.type as keyof typeof debtTypeColors]}>
                          {debt.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(debt.currentBalance, debt.currency)}
                      </TableCell>
                      <TableCell>
                        <I18nText text={format(new Date(debt.updatedAt), "MMM d, yyyy")}/>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <ActionMenuButton label={`Actions for ${debt.name}`} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(debt)}>
                              <Edit className="mr-2 h-4 w-4" />{" "}<I18nText text={"View Details"}/>{" "}</DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete?.(debt)}
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

      {/* No Debts State */}
      {debts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{""}<I18nText text={"No debts yet"}/>{""}</h3>
            <p className="text-muted-foreground text-center mb-4">{" "}<I18nText text={"Start tracking your debts to see your progress and manage payments."}/>{" "}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      {selectedDebt && (
        <DebtPaymentDialogSimple
          debt={selectedDebt}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
