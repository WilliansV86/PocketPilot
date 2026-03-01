import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewDebtPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Link href="/debts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Debts
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Create New Debt</h1>
          </div>
          
          <DebtForm
            mode="create"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
