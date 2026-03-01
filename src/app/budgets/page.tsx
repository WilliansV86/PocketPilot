import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BudgetsClientEnhanced } from "@/components/budgets/budgets-client-enhanced";

interface BudgetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  // Get current month and year from search params or default to current
  const params = await searchParams;
  const currentDate = new Date();
  const month = (params?.month as string) || (currentDate.getMonth() + 1).toString();
  const year = parseInt((params?.year as string) || currentDate.getFullYear().toString());

  // Move data fetching to client side for faster navigation
  return (
    <DashboardLayout>
      <BudgetsClientEnhanced 
        initialMonth={month}
        initialYear={year}
      />
    </DashboardLayout>
  );
}
