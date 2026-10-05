"use client";
import { useLanguage } from "@/components/language-provider";

import { I18nText } from "@/components/language-provider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { formatMoney } from "@/lib/currency";
import { statsDateLabel } from "@/lib/stats-date-range";
export const CHART_COLORS = { income: "#10b981", expenses: "#ef4444", net: "#14b8a6", neutral: "#94a3b8" };
export const chartTooltipStyle = { background: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12, fontSize: 12 };
export const compactChartAmount = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
type CashflowRow = { month: string; income: number; expenses: number; net?: number };
export function CashflowChart({ data, currency = "USD" }: { data: CashflowRow[]; currency?: string }) {
 const { t: ppT } = useLanguage();

  if (!data.length) return <p className="py-6 text-center text-sm text-muted-foreground">{""}<I18nText text={"No activity for this period."}/>{""}</p>;
  const rows = data.map(row => ({...row, label: /^\d{4}-\d{2}$/.test(row.month) ? ppT(statsDateLabel(row.month,true)) : ppT(row.month), net: row.net ?? row.income-row.expenses }));
  return <div className="min-w-0 space-y-2"><ResponsiveContainer width="100%" height={240}><BarChart data={rows} margin={{top:12,right:8,left:0,bottom:0}}>
    <CartesianGrid stroke="currentColor" opacity={0.1} vertical={false} />
    <XAxis dataKey="label" minTickGap={18} tick={{fill:"currentColor",fontSize:11}} tickLine={false} axisLine={false} />
    <YAxis width={46} tickFormatter={compactChartAmount} tick={{fill:"currentColor",fontSize:11}} tickLine={false} axisLine={false} />
    <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} />
    <Tooltip formatter={value=>formatMoney(Number(value),currency)} contentStyle={chartTooltipStyle} cursor={{fill:"currentColor",opacity:0.05}} />
    <Legend wrapperStyle={{fontSize:12,paddingTop:8}} iconType="circle" iconSize={8} />
    <Bar dataKey="income" name={ppT("Income")} fill={CHART_COLORS.income} radius={[3,3,0,0]} isAnimationActive={false} />
    <Bar dataKey="expenses" name={ppT("Expenses")} fill={CHART_COLORS.expenses} radius={[3,3,0,0]} isAnimationActive={false} />
    <Bar dataKey="net" name={ppT("Net cashflow")} fill={CHART_COLORS.net} radius={3} isAnimationActive={false} />
  </BarChart></ResponsiveContainer><p className="text-xs text-muted-foreground">{""}<I18nText text={"Amounts in"}/>{" "}{currency}{""}<I18nText text={". Net cashflow is income minus expenses."}/>{""}</p></div>;
}
export function SpendingBreakdown({ data, currency = "USD" }: { data: {name:string;amount:number;color?:string|null}[];currency?:string }) {
  const rows = [...data].sort((a,b)=>b.amount-a.amount);
  const total = rows.reduce((sum,row)=>sum+Math.round(row.amount*100),0)/100;
  if (!rows.length || total===0) return <p className="py-6 text-center text-sm text-muted-foreground">{""}<I18nText text={"No expenses for this period."}/>{""}</p>;
  return <div className="space-y-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-muted-foreground">{""}<I18nText text={"Total expenses"}/>{""}</span><span className="font-semibold tabular-nums">{formatMoney(total,currency)}</span></div><div className="max-h-80 space-y-4 overflow-y-auto pr-1">{rows.map((row,index)=>{
    const share = total>0 ? Math.max(0,row.amount)/total*100 : 0;
    return <div key={index} className="space-y-1.5"><div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm"><span className="min-w-0 break-words">{row.name}</span><span className="font-medium tabular-nums">{formatMoney(row.amount,currency)}</span></div><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${Math.min(share,100)}%`,backgroundColor:row.color||CHART_COLORS.neutral}} /></div><span className="w-12 text-right text-xs text-muted-foreground">{share.toFixed(1)}%</span></div></div>;
  })}</div></div>;
}
export function FinancialProgress({ value, label, status = "on-track" }: {value:number;label:string;status?:string}) {
  const percentage = Number.isFinite(value) ? Math.min(100,Math.max(0,value)) : 0;
  const color = status==="completed" ? CHART_COLORS.income : status==="behind" ? "#f59e0b" : CHART_COLORS.net;
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${percentage}%`,backgroundColor:color}} /></div>;
}
