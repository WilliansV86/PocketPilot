"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  ReceiptText, 
  PieChart, 
  MoreHorizontal,
  Menu,
  X,
  Target,
  TrendingDown,
  TrendingUp,
  Flag,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PrefetchLink } from "@/components/layout/prefetch-link";

// Main bottom navigation items (5 items max)
const bottomNavItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ReceiptText,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: PieChart,
  },
  {
    name: "Stats",
    href: "/stats",
    icon: BarChart3,
  },
  {
    name: "More",
    href: "#",
    icon: MoreHorizontal,
    isSpecial: true,
  },
];

// Additional items for the More drawer
const moreNavItems = [
  {
    name: "Accounts",
    href: "/accounts",
    icon: Wallet,
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Target,
  },
  {
    name: "Goals",
    href: "/goals",
    icon: Flag,
  },
  {
    name: "Debts",
    href: "/debts",
    icon: TrendingDown,
  },
  {
    name: "Money Owed",
    href: "/money-owed",
    icon: TrendingUp,
  },
];

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className={cn("md:hidden", className)}>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            if (item.isSpecial) {
              return (
                <Sheet key={item.name} open={moreOpen} onOpenChange={setMoreOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex h-full flex-col items-center justify-center gap-1 rounded-none border-0 text-xs"
                      size="sm"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh]">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">More</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMoreOpen(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Separator />
                      <nav className="grid gap-2">
                        {moreNavItems.map((moreItem) => {
                          const MoreIcon = moreItem.icon;
                          const moreActive = isActive(moreItem.href);
                          
                          return (
                            <PrefetchLink key={moreItem.href} href={moreItem.href}>
                              <Button
                                variant={moreActive ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3 h-12"
                                onClick={() => setMoreOpen(false)}
                              >
                                <MoreIcon className="h-5 w-5" />
                                <span>{moreItem.name}</span>
                              </Button>
                            </PrefetchLink>
                          );
                        })}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              );
            }
            
            return (
              <PrefetchLink key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className="flex h-full flex-col items-center justify-center gap-1 rounded-none border-0 text-xs"
                  size="sm"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Button>
              </PrefetchLink>
            );
          })}
        </div>
      </div>
      
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16" />
    </div>
  );
}
