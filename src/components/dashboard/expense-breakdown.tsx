"use client";
import { SpendingBreakdown } from "@/components/charts/financial-charts";
type ExpenseCategory = {id:string;name:string;color:string;amount:number;percentage:number};
export function ExpenseBreakdown({categories,currency="USD"}:{categories:ExpenseCategory[];currency?:string}) {
 return <SpendingBreakdown data={categories} currency={currency} />;
}
