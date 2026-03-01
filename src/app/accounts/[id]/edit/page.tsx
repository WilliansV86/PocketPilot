import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AccountForm } from "@/components/accounts/account-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountById } from "@/lib/actions/account-actions";

interface EditAccountPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAccountPage({ params }: EditAccountPageProps) {
  const { id } = await params;
  const { data: account, success } = await getAccountById(id);
  
  if (!success || !account) {
    notFound();
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Account</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm account={account} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
