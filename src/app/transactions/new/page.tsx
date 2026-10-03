import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransactionForm } from "@/components/transactions/transaction-form-new";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts } from "@/lib/actions/account-actions";
import { getCategories } from "@/lib/actions/category-actions";
import { getCreditCardPaymentSources } from "@/lib/actions/transaction-actions";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const { data: creditCards = [] } = await getCreditCardPaymentSources();
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
              creditCards={creditCards}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
