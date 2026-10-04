"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export const ActionMenuButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button> & { label: string }>(function ActionMenuButton({ label, className, ...props },ref) {
  return <Button ref={ref} type="button" variant="outline" size="sm" aria-label={label} className={cn("h-10 shrink-0 gap-1.5 rounded-lg border-border bg-background px-3 font-medium shadow-sm",className)} {...props}>Actions<ChevronDown aria-hidden="true" className="h-3.5 w-3.5" /></Button>;
});
