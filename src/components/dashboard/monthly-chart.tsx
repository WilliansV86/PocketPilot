"use client";
import { CashflowChart } from "@/components/charts/financial-charts";
type MonthlyData = { month:string;income:number;expenses:number;savings:number };
export function MonthlyChart({ data,currency="USD" }: {data:MonthlyData[];currency?:string}) {
 return <CashflowChart currency={currency} data={data.map(row=>({month:row.month,income:row.income,expenses:row.expenses,net:row.income-row.expenses}))} />;
}
