"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  ReceiptText, 
  PieChart, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Flag, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PrefetchLink } from "@/components/layout/prefetch-link";
import { COMPONENTS, COLORS, ANIMATIONS } from "@/lib/theme/tokens";

const navSections = [
  {
    title: "Finance",
    items: [
      {
        name: "Dashboard",
        iconColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Accounts",
        iconColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        href: "/accounts",
        icon: Wallet,
      },
      {
        name: "Transactions",
        iconColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        href: "/transactions",
        icon: ReceiptText,
      },
      {
        name: "Debts",
        iconColor: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
        href: "/debts",
        icon: TrendingDown,
      },
      {
        name: "Money Owed",
        iconColor: "bg-lime-500/10 text-lime-700 dark:text-lime-400",
        href: "/money-owed",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Planning",
    items: [
      {
        name: "Budgets",
        iconColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
        href: "/budgets",
        icon: Target,
      },
      {
        name: "Recurring Payments", iconColor: "bg-teal-500/10 text-teal-700 dark:text-teal-400", href: "/recurring", icon: ReceiptText,
      },
      {
        name: "Categories",
        iconColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        href: "/categories",
        icon: PieChart,
      },
      {
        name: "Goals",
        iconColor: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
        href: "/goals",
        icon: Flag,
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        name: "Stats",
        iconColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
        href: "/stats",
        icon: BarChart3,
      },
    ],
  },
];

interface MainNavProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function MainNav({ mobile = false, onClose }: MainNavProps) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleNavClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  const NavContent = () => (
    <nav aria-label="Main navigation" className="flex flex-col gap-4">
      {navSections.map((section) => {
        const isCollapsed = collapsedSections.has(section.title);
        const hasActiveItem = section.items.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/")));

        return (
          <Collapsible
            key={section.title}
            open={!isCollapsed}
            onOpenChange={() => toggleSection(section.title)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between rounded-lg px-3 py-2 h-auto text-xs font-semibold uppercase tracking-wider",
                  COLORS.SIDEBAR.GROUP_TITLE,
                  hasActiveItem && !isCollapsed && "bg-accent/50",
                  "hover:bg-accent/50",
                  ANIMATIONS.TRANSITION.COLOR
                )}
              >
                <span className="flex items-center gap-2">
                  {section.title}
                  {hasActiveItem && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    ANIMATIONS.TRANSITION.TRANSFORM,
                    !isCollapsed && "rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1.5">
              {section.items.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full h-12 justify-start gap-3 rounded-xl border px-3 text-[15px] font-medium",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
                      ? "border-blue-500/30 bg-blue-500/15 text-blue-700 shadow-sm hover:bg-blue-500/20 dark:text-blue-300"
                      : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                    ANIMATIONS.TRANSITION.COLOR
                  )}
                  asChild
                  onClick={handleNavClick}
                >
                  <PrefetchLink 
                    href={item.href}
                    scroll={false}
                    aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/")) ? "page" : undefined}
                  >
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", item.iconColor)}><item.icon className="size-5" /></span>
                    <span>{item.name}</span>
                  </PrefetchLink>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );

  if (mobile) {
    return <NavContent />;
  }

  return <NavContent />;
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold">PocketPilot</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4">
            <MainNav mobile onClose={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
