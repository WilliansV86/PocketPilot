import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GoalsClient } from "./goals-client";

export default async function GoalsPage() {
  return (
    <DashboardLayout>
      <GoalsClient />
    </DashboardLayout>
  );
}
