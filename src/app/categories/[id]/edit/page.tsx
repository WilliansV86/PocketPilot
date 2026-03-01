import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryForm } from "@/components/categories/category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryById } from "@/lib/actions/category-actions";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const { data: category, success } = await getCategoryById(id);
  
  if (!success || !category) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm 
              category={category}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
