import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoriesTable } from "@/components/categories/categories-table";
import { Button } from "@/components/ui/button";
import { PATTERNS, TYPOGRAPHY, BUTTON, SPACING } from "@/lib/ui-constants";
import Link from "next/link";
import { PlusCircle, Archive } from "lucide-react";
import { CategoriesClient } from "@/components/categories/categories-client";

interface CategoriesPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  // Move data fetching to client side for faster navigation
  return (
    <DashboardLayout>
      <div className={PATTERNS.PAGE_CONTENT}>
        <div className="flex items-center justify-between">
          <h1 className={TYPOGRAPHY.PAGE_TITLE}>Categories</h1>
          <Button asChild className={BUTTON.PRIMARY_ACTION}>
            <Link href="/categories/new">
              <PlusCircle className="h-4 w-4" />
              New Category
            </Link>
          </Button>
        </div>
        
        <div className={SPACING.MARGIN.SECTION}>
          <CategoriesClient searchParams={searchParams} />
        </div>
      </div>
    </DashboardLayout>
  );
}
