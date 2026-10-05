
import { I18nText } from "@/components/language-provider";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getDebtById } from "@/lib/actions/debt-actions";
import Link from "next/link";

export default async function EditDebtPage({ params }: { params: Promise<{ id: string }> }) {
  await auth.protect();

  const { data: debt, success } = await getDebtById((await params).id);

  if (!success || !debt) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Link href="/debts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />{" "}<I18nText text={"Back to Debts"}/>{" "}</Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{""}<I18nText text={"Edit Debt"}/>{""}</h1>
          </div>
          
          <DebtForm
            mode="edit"
            debt={debt}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
