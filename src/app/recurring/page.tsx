import { auth } from "@clerk/nextjs/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RecurringClient } from "@/components/recurring/recurring-client";
export default async function Page(){await auth.protect();return <DashboardLayout><RecurringClient /></DashboardLayout>;}
