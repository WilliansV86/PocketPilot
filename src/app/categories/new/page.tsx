import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryForm } from "@/components/categories/category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewCategoryPage() {
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
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
