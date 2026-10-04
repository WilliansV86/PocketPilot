"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ReceiptText, PieChart, Target, TrendingDown, TrendingUp, Flag, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PrefetchLink } from "@/components/layout/prefetch-link";

import { SwipeBottomSheet } from "@/components/layout/swipe-bottom-sheet";

const sections = [
  {
    name: "Finance", icon: Wallet,
    color: "text-emerald-700 dark:text-emerald-400",
    items: [
      { name: "Accounts", href: "/accounts", icon: Wallet, color: "text-emerald-700 dark:text-emerald-400" },
      { name: "Transactions", href: "/transactions", icon: ReceiptText, color: "text-blue-700 dark:text-blue-400" },
      { name: "Debts", href: "/debts", icon: TrendingDown, color: "text-orange-700 dark:text-orange-400" },
      { name: "Money Owed", href: "/money-owed", icon: TrendingUp, color: "text-lime-700 dark:text-lime-400" },
    ],
  },
  {
    name: "Planning", icon: Target,
    color: "text-violet-700 dark:text-violet-400",
    items: [
      { name: "Budgets", href: "/budgets", icon: Target, color: "text-violet-700 dark:text-violet-400" },
      { name: "Categories", href: "/categories", icon: PieChart, color: "text-amber-700 dark:text-amber-400" },
      { name: "Goals", href: "/goals", icon: Flag, color: "text-teal-700 dark:text-teal-400" },
    ],
  },
  {
    name: "Insights", icon: BarChart3,
    color: "text-indigo-700 dark:text-indigo-400",
    items: [
      { name: "Stats", href: "/stats", icon: BarChart3, color: "text-indigo-700 dark:text-indigo-400" },
    ],
  },
];

export function MobileNavigation({ className }: { className?: string }) {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const tabClass = "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-none border-0 text-xs";

  return (
    <div className={cn("md:hidden", className)}>
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-4">
          <Button asChild variant={isActive("/") ? "secondary" : "ghost"} className={tabClass}>
            <PrefetchLink href="/" scroll aria-current={isActive("/") ? "page" : undefined}>
              <LayoutDashboard className="h-5 w-5 text-sky-700 dark:text-sky-400" />
              <span>Dashboard</span>
            </PrefetchLink>
          </Button>
          {sections.map(section => {
            const Icon = section.icon;
            const active = section.items.some(item => isActive(item.href));
            return (
              <Sheet key={section.name} open={openSection === section.name} onOpenChange={open => setOpenSection(open ? section.name : null)}>
                <SheetTrigger asChild>
                  <Button variant={active ? "secondary" : "ghost"} className={tabClass} aria-label={`Open ${section.name} menu`}>
                    <Icon className={cn("h-5 w-5", section.color)} />
                    <span>{section.name}</span>
                    {active && <span className="sr-only">Current section</span>}
                  </Button>
                </SheetTrigger>
                <SwipeBottomSheet open={openSection === section.name} onDismiss={() => setOpenSection(null)}>
                  <SheetHeader>
                    <SheetTitle>{section.name}</SheetTitle>
                    <SheetDescription>Choose a page in {section.name.toLowerCase()}.</SheetDescription>
                  </SheetHeader>
                  <nav aria-label={`${section.name} pages`} className="grid gap-2 px-4">
                    {section.items.map(item => {
                      const ItemIcon = item.icon;
                      return (
                        <Button key={item.href} asChild variant={isActive(item.href) ? "secondary" : "ghost"} className="h-12 w-full justify-start gap-3 text-base">
                          <PrefetchLink href={item.href} scroll aria-current={isActive(item.href) ? "page" : undefined} onClick={() => setOpenSection(null)}>
                            <ItemIcon className={cn("h-5 w-5 shrink-0", item.color)} />
                            <span>{item.name}</span>
                          </PrefetchLink>
                        </Button>
                      );
                    })}
                  </nav>
                </SwipeBottomSheet>
              </Sheet>
            );
          })}
        </div>
      </nav>
      <div className="h-[calc(64px+env(safe-area-inset-bottom))]" />
    </div>
  );
}
