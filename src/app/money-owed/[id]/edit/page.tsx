import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MoneyOwedForm } from "@/components/money-owed/money-owed-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getMoneyOwedById } from "@/lib/actions/money-owed-actions";
import Link from "next/link";

export default async function EditMoneyOwedPage({ params }: { params: { id: string } }) {
  const { data: moneyOwed, success } = await getMoneyOwedById(params.id);

  if (!success || !moneyOwed) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Link href="/money-owed">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Money Owed
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Edit Money Owed</h1>
          </div>
          
          <MoneyOwedForm
            mode="edit"
            moneyOwed={moneyOwed}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
