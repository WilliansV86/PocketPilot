import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransactionForm } from "@/components/transactions/transaction-form-new";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts } from "@/lib/actions/account-actions";
import { getCategories } from "@/lib/actions/category-actions";

export default async function NewTransactionPage() {
  // Fetch accounts and categories for the form dropdowns
  const { data: accounts = [], success: accountsSuccess } = await getAccounts();
  const { data: categories = [], success: categoriesSuccess } = await getCategories();
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Transaction</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm 
              mode="create" 
              accounts={accounts}
              categories={categories}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
