import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransactionsPageClient } from "@/components/transactions/transactions-page-client";
import TransactionsPageWithFilter from "@/components/transactions/transactions-page-with-filter";

export default async function TransactionsPage() {
  await auth.protect();

  return (
    <DashboardLayout>
      <TransactionsPageClient>
        <TransactionsPageWithFilter />
      </TransactionsPageClient>
    </DashboardLayout>
  );
}
