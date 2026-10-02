import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export function getDateRangePreset(preset: string): DateRange {
  const now = new Date();
  
  switch (preset) {
    case "this_month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: "This Month"
      };
    case "last_month":
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: "Last Month"
      };
    case "last_3_months":
      return {
        start: startOfMonth(subMonths(now, 2)),
        end: endOfMonth(now),
        label: "Last 3 Months"
      };
    case "last_6_months":
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now),
        label: "Last 6 Months"
      };
    case "ytd":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: "Year to Date"
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: "This Month"
      };
  }
}

