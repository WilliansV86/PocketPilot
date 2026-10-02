import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsClient } from "./stats-client";

export default async function StatsPage() {
  await auth.protect();

  return (
    <DashboardLayout>
      <StatsClient />
    </DashboardLayout>
  );
}
