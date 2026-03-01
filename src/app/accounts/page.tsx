import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountsPageClient } from "@/components/accounts/accounts-page-client";
import { Button } from "@/components/ui/button";
import { TYPOGRAPHY, LAYOUT, COMPONENTS } from "@/lib/theme/tokens";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function AccountsPage() {
  // Move data fetching to client side for faster navigation
  return (
    <DashboardLayout>
      <AccountsPageClient>
        <div className={LAYOUT.PAGE.CONTENT}>
          <div className={LAYOUT.PAGE.HEADER}>
            <h1 className={TYPOGRAPHY.PAGE_TITLE}>Accounts</h1>
            <Button asChild className={COMPONENTS.BUTTON.PRIMARY}>
              <Link href="/accounts/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Account
              </Link>
            </Button>
          </div>
          
          <div className={LAYOUT.SPACING.SECTION}>
            <div className={COMPONENTS.CARD.CONTAINER}>
              <AccountsTable />
            </div>
          </div>
        </div>
      </AccountsPageClient>
    </DashboardLayout>
  );
}
