import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsClient } from "./stats-client";

export default async function StatsPage() {
  return (
    <DashboardLayout>
      <StatsClient />
    </DashboardLayout>
  );
}
