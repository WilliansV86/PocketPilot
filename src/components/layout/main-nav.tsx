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
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Accounts",
        href: "/accounts",
        icon: Wallet,
      },
      {
        name: "Transactions",
        href: "/transactions",
        icon: ReceiptText,
      },
      {
        name: "Categories",
        href: "/categories",
        icon: PieChart,
      },
    ],
  },
  {
    title: "Planning",
    items: [
      {
        name: "Budgets",
        href: "/budgets",
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
    ],
  },
  {
    title: "Insights",
    items: [
      {
        name: "Stats",
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
    <nav className="flex flex-col gap-1">
      {navSections.map((section) => {
        const isCollapsed = collapsedSections.has(section.title);
        const hasActiveItem = section.items.some(item => pathname === item.href);

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
                  "w-full justify-between px-3 py-2 h-auto font-medium text-sm",
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
            <CollapsibleContent className="space-y-1">
              {section.items.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    pathname === item.href 
                      ? COMPONENTS.NAV.ITEM_ACTIVE 
                      : COMPONENTS.NAV.ITEM,
                    ANIMATIONS.TRANSITION.COLOR
                  )}
                  asChild
                  onClick={handleNavClick}
                >
                  <PrefetchLink 
                    href={item.href}
                    scroll={false}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
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
