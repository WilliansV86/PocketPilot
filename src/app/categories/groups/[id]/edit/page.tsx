import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryGroupForm } from "@/components/categories/category-group-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryById } from "@/lib/actions/category-actions";

interface EditCategoryGroupPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryGroupPage({ params }: EditCategoryGroupPageProps) {
  const { id } = await params;
  const { data: categoryGroup, success } = await getCategoryById(id);
  
  if (!success || !categoryGroup) {
    notFound();
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Category Group</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryGroupForm 
              categoryGroup={categoryGroup}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
