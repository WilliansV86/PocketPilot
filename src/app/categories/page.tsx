import { I18nText } from "@/components/language-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoriesTable } from "@/components/categories/categories-table";
import { Button } from "@/components/ui/button";
import { PATTERNS, TYPOGRAPHY, BUTTON, SPACING } from "@/lib/ui-constants";
import Link from "next/link";
import { PlusCircle, Archive } from "lucide-react";
import { CategoriesClient } from "@/components/categories/categories-client";

interface CategoriesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  // Move data fetching to client side for faster navigation
  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className={TYPOGRAPHY.PAGE_TITLE}>{""}<I18nText text={"Categories"}/>{""}</h1>
          <Button asChild className={BUTTON.PRIMARY_ACTION}>
            <Link href="/categories/new">
              <PlusCircle className="h-4 w-4" />{" "}<I18nText text={"New Category"}/>{" "}</Link>
          </Button>
        </div>
        
        <div className="mt-3">
          <CategoriesClient searchParams={await searchParams} />
        </div>
      </div>
    </DashboardLayout>
  );
}
