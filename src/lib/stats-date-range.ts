export type DateRange = { start: Date; end: Date; label: string };

// Transactions store calendar dates in UTC; choose the current date in Alberta,
// then use UTC boundaries so browser and server select the same calendar days.
export function getDateRangePreset(preset: string, now = new Date()): DateRange {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const year = part("year"), month = part("month") - 1, day = part("day");
  let start = new Date(Date.UTC(year, month, 1));
  let end = new Date(Date.UTC(year, month, day + 1) - 1);
  let label = "This month to date";
  if (preset === "last_month") {
    start = new Date(Date.UTC(year, month - 1, 1));
    end = new Date(Date.UTC(year, month, 1) - 1);
    label = "Last month";
  } else if (preset === "last_3_months" || preset === "last_6_months") {
    start = new Date(Date.UTC(year, month - (preset === "last_3_months" ? 2 : 5), 1));
    label = preset === "last_3_months" ? "Last 3 months to date" : "Last 6 months to date";
  } else if (preset === "ytd") {
    start = new Date(Date.UTC(year, 0, 1));
    label = "Year to date (YTD)";
  }
  return { start, end, label };
}

export function statsDateLabel(date: string | Date, monthOnly = false) {
  const value = typeof date === "string" ? new Date(date.length === 7 ? date + "-01T12:00:00Z" : date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC", month: "short", ...(monthOnly ? {} : { day: "numeric" as const }), year: "numeric",
  }).format(value);
}
