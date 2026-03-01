import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AccountForm } from "@/components/accounts/account-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAccountPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Account</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
