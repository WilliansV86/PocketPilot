import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GoalsClient } from "./goals-client";

export default async function GoalsPage() {
  await auth.protect();

  return (
    <DashboardLayout>
      <GoalsClient />
    </DashboardLayout>
  );
}
