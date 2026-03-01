"use client";

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
import { formatCurrency } from "@/lib/utils";

interface Debt {
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
    return Math.min((paid / debt.originalAmount) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Unique Summary Cards - Only non-duplicate metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Interest Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {openDebtList.length > 0 
                ? (openDebtList.reduce((sum, debt) => sum + (debt.interestRateAPR || 0), 0) / openDebtList.length).toFixed(2)
                : "0.00"
              }%
            </div>
            <p className="text-xs text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Closed Debts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{closedDebtList.length}</div>
            <p className="text-xs text-muted-foreground">Paid off</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Debts */}
      {openDebtList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Debts</CardTitle>
            <CardDescription>
              Your active debts and payment progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Min Payment</TableHead>
                  <TableHead>Due Day</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openDebtList.map((debt) => {
                  const Icon = debtTypeIcons[debt.type as keyof typeof debtTypeIcons] || DollarSign;
                  const progressPercentage = getProgressPercentage(debt);
                  
                  return (
                    <TableRow key={debt.id}>
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
                        {formatCurrency(debt.currentBalance)}
                      </TableCell>
                      <TableCell>
                        {debt.originalAmount ? (
                          <div className="space-y-1">
                            <Progress value={progressPercentage} className="w-[60px]" />
                            <div className="text-xs text-muted-foreground">
                              {progressPercentage.toFixed(1)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {debt.minimumPayment ? formatCurrency(debt.minimumPayment) : "—"}
                      </TableCell>
                      <TableCell>
                        {debt.dueDayOfMonth ? `Day ${debt.dueDayOfMonth}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePayment(debt)}>
                              <TrendingDown className="mr-2 h-4 w-4" />
                              Make Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit?.(debt)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete?.(debt)}
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

      {/* Closed Debts */}
      {closedDebtList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Closed Debts</CardTitle>
            <CardDescription>
              Debts that have been fully paid off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Final Balance</TableHead>
                  <TableHead>Closed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        {formatCurrency(debt.currentBalance)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(debt.updatedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(debt)}>
                              <Edit className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete?.(debt)}
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

      {/* No Debts State */}
      {debts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No debts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your debts to see your progress and manage payments.
            </p>
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
