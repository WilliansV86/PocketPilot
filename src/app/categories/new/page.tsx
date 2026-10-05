import { I18nText } from "@/components/language-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryForm } from "@/components/categories/category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const params = await searchParams;
  const returnTo = params.returnTo && /^\/budgets(?:\?[^#]*)?$/.test(params.returnTo) ? params.returnTo : "/categories";
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{""}<I18nText text={"Create New Category"}/>{""}</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{""}<I18nText text={"Category Details"}/>{""}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm 
              mode="create"
              returnTo={returnTo} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
