"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type StatsSummaryProps = {
  monthlyCashflow: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  categorySpending: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  accountBalances: Array<{
    name: string;
    balance: number;
    color: string;
  }>;
};

export function MobileStatsSummary({ monthlyCashflow, categorySpending, accountBalances }: StatsSummaryProps) {
  // Calculate key metrics
  const latestMonth = monthlyCashflow[monthlyCashflow.length - 1];
  const previousMonth = monthlyCashflow[monthlyCashflow.length - 2];
  
  const totalIncome = latestMonth?.income || 0;
  const totalExpenses = latestMonth?.expenses || 0;
  const netCashflow = latestMonth?.net || 0;
  
  const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
  const topCategory = categorySpending.length > 0 ? categorySpending[0] : null;
  
  const totalBalance = accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Calculate trends
  const incomeTrend = previousMonth ? 
    ((totalIncome - previousMonth.income) / previousMonth.income) * 100 : 0;
  const expenseTrend = previousMonth ? 
    ((totalExpenses - previousMonth.expenses) / previousMonth.expenses) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              {incomeTrend > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-green-600" />
              )}
            </div>
            <div className="text-xs text-green-700 font-medium">Income</div>
            <div className="text-lg font-bold text-green-800">
              {formatCurrency(totalIncome)}
            </div>
            {incomeTrend !== 0 && (
              <div className="text-xs text-green-600 mt-1">
                {incomeTrend > 0 ? '+' : ''}{incomeTrend.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              {expenseTrend < 0 ? (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              ) : (
                <ArrowUpRight className="h-3 w-3 text-red-600" />
              )}
            </div>
            <div className="text-xs text-red-700 font-medium">Expenses</div>
            <div className="text-lg font-bold text-red-800">
              {formatCurrency(totalExpenses)}
            </div>
            {expenseTrend !== 0 && (
              <div className="text-xs text-red-600 mt-1">
                {expenseTrend > 0 ? '+' : ''}{expenseTrend.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Cashflow Card */}
      <Card className={netCashflow >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Net Cashflow</span>
            </div>
            <div className={`text-lg font-bold ${netCashflow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              {formatCurrency(netCashflow)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Category */}
      {topCategory && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: topCategory.color }}
                />
                <span className="text-sm font-medium text-purple-700">Top Category</span>
              </div>
              <div className="text-sm font-bold text-purple-800">
                {formatCurrency(topCategory.amount)}
              </div>
            </div>
            <div className="text-xs text-purple-600 mt-1 truncate">
              {topCategory.name}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Balance */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Total Balance</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
