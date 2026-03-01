import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MoneyOwedForm } from "@/components/money-owed/money-owed-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewMoneyOwedPage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Create Money Owed</h1>
          </div>
          
          <MoneyOwedForm
            mode="create"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
