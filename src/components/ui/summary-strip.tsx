import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
type SummaryItem = { label: string; value: string | number; detail?: string; icon?: LucideIcon; tone?: "default" | "good" | "warning" | "danger" };
export function SummaryStrip({ items, lead = false }: { items: SummaryItem[]; lead?: boolean }) {
  const tones = { default: "text-foreground", good: "text-emerald-600 dark:text-emerald-400", warning: "text-amber-600 dark:text-amber-400", danger: "text-red-600 dark:text-red-400" };
  return <dl className={cn("grid gap-2", lead ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 lg:grid-cols-4")}>
    {items.map((item,index) => { const Icon = item.icon; return <div key={item.label} className={cn("min-w-0 rounded-xl border bg-card p-3", lead && index === 0 && "col-span-3 sm:col-span-1")}>
      <dt className="flex items-start justify-between gap-2 text-xs text-muted-foreground"><span>{item.label}</span>{Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}</dt>
      <dd className={cn("mt-1 break-words text-lg font-semibold tabular-nums sm:text-xl",tones[item.tone ?? "default"])}>{item.value}</dd>
      {item.detail && <dd className="mt-1 text-xs text-muted-foreground">{item.detail}</dd>}
    </div>; })}
  </dl>;
}
