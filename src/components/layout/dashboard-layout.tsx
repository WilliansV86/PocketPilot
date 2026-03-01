"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainNav } from "./main-nav";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationOptimizer } from "./navigation-optimizer";
import { PerformanceMonitor } from "./performance-monitor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showMonthSelector?: boolean;
}

export function DashboardLayout({ children, title, showMonthSelector = false }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // Get page title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    const pathMap: Record<string, string> = {
      "/": "Dashboard",
      "/accounts": "Accounts",
      "/transactions": "Transactions",
      "/categories": "Categories",
      "/budgets": "Budgets",
      "/goals": "Goals",
      "/debts": "Debts",
      "/money-owed": "Money Owed",
      "/stats": "Statistics",
    };
    
    return pathMap[pathname] || "PocketPilot";
  };

  const pageTitle = getPageTitle();

  return (
    <div className="flex min-h-screen flex-col">
      <PerformanceMonitor />
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 flex-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold hidden md:block">PocketPilot</span>
              <span className="text-xl font-bold md:hidden">PP</span>
            </Link>
            
            {/* Page Title */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Global Month Selector (optional) */}
            {showMonthSelector && (
              <div className="hidden md:block">
                <Select defaultValue={format(new Date(), "yyyy-MM")}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-01">January 2025</SelectItem>
                    <SelectItem value="2025-02">February 2025</SelectItem>
                    <SelectItem value="2025-03">March 2025</SelectItem>
                    <SelectItem value="2025-04">April 2025</SelectItem>
                    <SelectItem value="2025-05">May 2025</SelectItem>
                    <SelectItem value="2025-06">June 2025</SelectItem>
                    <SelectItem value="2025-07">July 2025</SelectItem>
                    <SelectItem value="2025-08">August 2025</SelectItem>
                    <SelectItem value="2025-09">September 2025</SelectItem>
                    <SelectItem value="2025-10">October 2025</SelectItem>
                    <SelectItem value="2025-11">November 2025</SelectItem>
                    <SelectItem value="2025-12">December 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r bg-background hidden md:block">
          <div className="flex h-full flex-col gap-2 p-4">
            <MainNav />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {/* Mobile Page Title */}
          <div className="md:hidden border-b bg-muted/30 px-4 py-3">
            <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          </div>
          
          <div className="p-4 md:p-6">
            <NavigationOptimizer>
              {children}
            </NavigationOptimizer>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}
