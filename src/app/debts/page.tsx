import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DebtList } from "@/components/debts/debt-list";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { getDebts } from "@/lib/actions/debt-actions";
import { deleteDebt } from "@/lib/actions/debt-actions";
import { DebtsClientEnhanced } from "@/components/debts/debts-client-enhanced";
import Link from "next/link";

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

export default async function DebtsPage() {
  // Fetch all debts
  const { data: debts = [], success } = await getDebts();

  if (!success) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Error Loading Debts</h3>
              <p className="text-muted-foreground">Unable to load your debts. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <DebtsClientEnhanced debts={debts} />
      </div>
    </DashboardLayout>
  );
}
