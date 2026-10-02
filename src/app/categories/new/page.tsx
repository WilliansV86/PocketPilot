import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryForm } from "@/components/categories/category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  await auth.protect();

  const params = await searchParams;
  const returnTo = params.returnTo && /^\/budgets(?:\?[^#]*)?$/.test(params.returnTo) ? params.returnTo : "/categories";
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Category</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
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
