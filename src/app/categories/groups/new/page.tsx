import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CategoryGroupForm } from "@/components/categories/category-group-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewCategoryGroupPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Category Group</h1>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryGroupForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
