import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransactionForm } from "@/components/transactions/transaction-form-new";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransactionById } from "@/lib/actions/transaction-actions";
import { getAccounts } from "@/lib/actions/account-actions";
import { getCategories } from "@/lib/actions/category-actions";

interface EditTransactionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { id } = await params;
  const { data: transaction, success } = await getTransactionById(id);
  
  if (!success || !transaction) {
    notFound();
  }

  // Fetch accounts and categories for the form dropdowns
  const { data: accounts = [], success: accountsSuccess } = await getAccounts();
  const { data: categories = [], success: categoriesSuccess } = await getCategories();
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Transaction</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm 
              transaction={transaction}
              accounts={accounts}
              categories={categories}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
