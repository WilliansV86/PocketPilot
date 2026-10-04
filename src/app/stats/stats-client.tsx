"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import { CurrencyPicker, usePreferredCurrency } from "@/components/ui/currency-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsTable } from "@/components/stats/stats-table";
import { getDateRangePreset, statsDateLabel } from "@/lib/stats-date-range";
import { formatMoney } from "@/lib/currency";
const StatsCharts = dynamic(() => import("@/components/stats/stats-charts").then(mod => mod.StatsCharts), { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> });
type StatsData = {
 monthlyCashflow: { month: string; income: number; expenses: number; net: number }[];
 categorySpending: { name: string; amount: number; color: string }[];
 accountBreakdown: { name: string; balance: number; color: string }[];
 dailySpend: { date: string; amount: number }[];
 topSpending: { id: string; description: string; amount: number; date: string; category: { name: string; color: string } | null }[];
};
export function StatsClient() {
 const requestIdRef = useRef(0);
 const [currency, setCurrency] = usePreferredCurrency("stats");
 const [selectedRange, setSelectedRange] = useState("this_month");
 const [snapshot, setSnapshot] = useState<{ data: StatsData; currency: string; preset: string; range: ReturnType<typeof getDateRangePreset> } | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const loadData = useCallback(async () => {
  const requestId = ++requestIdRef.current;
  setLoading(true); setError("");
  try {
   const range = getDateRangePreset(selectedRange);
   const request = async (path: string, get = false) => {
    const response = await fetch(`/api/stats/${path}${get ? `?currency=${currency}` : ""}`, { method: get ? "GET" : "POST", cache: "no-store", ...(get ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency, preset: selectedRange }) }) });
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error("Could not load statistics");
    return result.data;
   };
   const [monthlyCashflow, categorySpending, accountBreakdown, dailySpend, topSpending] = await Promise.all([request("monthly-cashflow"), request("category-spending"), request("account-breakdown",true), request("daily-spend"), request("top-spending")]);
   if (requestId === requestIdRef.current) setSnapshot({ data: { monthlyCashflow, categorySpending, accountBreakdown, dailySpend, topSpending }, currency, preset: selectedRange, range });
  } catch {
   if (requestId === requestIdRef.current) setError("Statistics could not be updated. Please try again.");
  } finally { if (requestId === requestIdRef.current) setLoading(false); }
 }, [selectedRange,currency]);
 useEffect(() => {
  void loadData();
  const refresh = () => { if (document.visibilityState === "visible") void loadData(); };
  window.addEventListener("focus",refresh);
  return () => { ++requestIdRef.current; window.removeEventListener("focus",refresh); };
 }, [loadData]);
 const current = snapshot?.currency === currency && snapshot.preset === selectedRange;
 const totals = snapshot?.data.monthlyCashflow.reduce((sum,row) => ({ income: sum.income + Math.round(row.income*100), expenses: sum.expenses + Math.round(row.expenses*100) }), { income: 0, expenses: 0 });
 const panels = snapshot ? [
  { title: "Income vs expenses", description: snapshot.range.label, type: "monthly-cashflow" as const, data: snapshot.data.monthlyCashflow },
  { title: "Spending by category", description: "All expenses, including uncategorized transactions", type: "category-spending" as const, data: snapshot.data.categorySpending },
  { title: "Current account balances", description: "Your current position — independent of the selected period", type: "account-breakdown" as const, data: snapshot.data.accountBreakdown },
  { title: "Daily spending", description: snapshot.range.label, type: "daily-spend" as const, data: snapshot.data.dailySpend },
 ] : [];
 return <div className="w-full space-y-4">
  <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Statistics</h1><Button variant="outline" size="sm" disabled={loading} onClick={() => void loadData()}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div>
  <CurrencyPicker remember compact preferenceKey="stats" value={currency} onChange={setCurrency} />
  <Select value={selectedRange} onValueChange={setSelectedRange}><SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="this_month">This month to date</SelectItem><SelectItem value="last_month">Last month</SelectItem><SelectItem value="last_3_months">Last 3 months</SelectItem><SelectItem value="last_6_months">Last 6 months</SelectItem><SelectItem value="ytd">Year to date (YTD)</SelectItem></SelectContent></Select>
  {error && <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm">{error} <Button variant="link" onClick={() => void loadData()}>Retry</Button></div>}
  {loading && <p role="status" className="text-sm text-muted-foreground">Updating statistics…</p>}
  {snapshot && current ? <div className="space-y-4" aria-busy={loading}>
   <p className="text-xs text-muted-foreground">{statsDateLabel(snapshot.range.start)} – {statsDateLabel(snapshot.range.end)} · Alberta calendar dates · {currency}</p>
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[
    { label: "Income", value: totals!.income/100, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Expenses", value: totals!.expenses/100, color: "text-red-600 dark:text-red-400" },
    { label: "Net cashflow", value: (totals!.income-totals!.expenses)/100, color: "text-teal-600 dark:text-teal-400" },
   ].map(item => <Card key={item.label} className={item.label === "Net cashflow" ? "col-span-2 sm:col-span-1" : ""}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className={`mt-1 break-words text-xl font-bold tabular-nums ${item.color}`}>{formatMoney(item.value,currency)}</p></CardContent></Card>)}</div>
   <p className="text-xs leading-relaxed text-muted-foreground">Totals use recorded income and expense transactions. Transfers and credit card repayments are excluded to avoid counting spending twice. Money Owed receipts recorded as income are included. Balance edits alone do not count as income or spending.</p>
   <div className="grid gap-4 lg:grid-cols-2">{panels.map(panel => <Card key={panel.type}><CardHeader className="p-4 pb-2"><CardTitle className="text-base">{panel.title}</CardTitle><CardDescription className="text-xs">{panel.description}</CardDescription></CardHeader><CardContent className="min-w-0 p-4 pt-2"><StatsCharts currency={currency} type={panel.type} data={panel.data} dateRange={snapshot.range} /></CardContent></Card>)}</div>
   <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-base">Largest expenses</CardTitle><CardDescription>Up to 10 transactions for {snapshot.range.label.toLowerCase()}</CardDescription></CardHeader><CardContent className="p-4 pt-2"><StatsTable currency={currency} data={snapshot.data.topSpending} /></CardContent></Card>
  </div> : !loading && !error ? <p className="text-sm text-muted-foreground">Select a period to view statistics.</p> : null}
 </div>;
}
