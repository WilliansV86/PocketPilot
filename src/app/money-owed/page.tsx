import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MoneyOwedClient } from "./money-owed-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMoneyOwed } from "@/lib/actions/money-owed-actions";

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

export default async function MoneyOwedPage() {
  // Fetch all money owed records
  const { data: moneyOwed = [], success, error } = await getMoneyOwed();

  if (!success) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Error Loading Money Owed</h3>
              <p className="text-muted-foreground text-center">
                {error || "Unable to load your money owed records. Please try again later."}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <MoneyOwedClient moneyOwed={moneyOwed} />
      </div>
    </DashboardLayout>
  );
}
