import type { DateRange } from "./stats-date-range";
type Transaction = { date: Date; amount: unknown; type?: string; category?: { id?: string; name: string; color: string | null } | null };
const cents = (amount: unknown) => Math.round(Number(amount) * 100);
const inRange = (t: Transaction, range: DateRange) => t.date >= range.start && t.date <= range.end;

export function monthlyCashflow(transactions: Transaction[], range: DateRange) {
  const buckets = new Map<string, { income: number; expenses: number }>();
  for (let date = new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth(), 1)); date <= range.end; date.setUTCMonth(date.getUTCMonth() + 1)) {
    buckets.set(date.toISOString().slice(0, 7), { income: 0, expenses: 0 });
  }
  for (const t of transactions) {
    if (!inRange(t, range)) continue;
    const bucket = buckets.get(t.date.toISOString().slice(0, 7));
    if (bucket && t.type === "INCOME") bucket.income += cents(t.amount);
    if (bucket && t.type === "EXPENSE") bucket.expenses += cents(t.amount);
  }
  return [...buckets].map(([month, b]) => ({ month, income: b.income / 100, expenses: b.expenses / 100, net: (b.income - b.expenses) / 100 }));
}

export function categorySpending(transactions: Transaction[]) {
  const buckets = new Map<string, { name: string; amount: number; color: string }>();
  for (const t of transactions) {
    const key = t.category?.id ?? t.category?.name ?? "__uncategorized__";
    const bucket = buckets.get(key) ?? { name: t.category?.name ?? "Uncategorized", amount: 0, color: t.category?.color ?? "#94a3b8" };
    bucket.amount += cents(t.amount);
    buckets.set(key, bucket);
  }
  return [...buckets.values()].map(b => ({ ...b, amount: b.amount / 100 })).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

export function dailySpending(transactions: Transaction[], range: DateRange) {
  const buckets = new Map<string, number>();
  for (let date = new Date(range.start); date <= range.end; date.setUTCDate(date.getUTCDate() + 1)) buckets.set(date.toISOString().slice(0, 10), 0);
  for (const t of transactions) {
    if (!inRange(t, range)) continue;
    const key = t.date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + cents(t.amount));
  }
  return [...buckets].map(([date, amount]) => ({ date, amount: amount / 100 }));
}
