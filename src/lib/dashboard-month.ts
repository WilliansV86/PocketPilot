import { currentTransactionMonth } from "@/lib/transaction-month";

export function dashboardMonth(value?: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1900 && Number(value.slice(0, 4)) <= 9998 ? value : currentTransactionMonth();
}
export function dashboardMonthRange(value?: string) {
  const month = dashboardMonth(value);
  const [year, number] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(year, number - 1, 1)), end: new Date(Date.UTC(year, number, 1)) };
}
export function dashboardChartMonths(value?: string) {
  const [year, month] = dashboardMonth(value).split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(year, month - 6 + i, 1)));
}
