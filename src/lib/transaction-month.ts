// Match the reminder timezone even when a hosting server uses UTC.
export function currentTransactionMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "2-digit" }).formatToParts(now);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
}
export function resolveTransactionMonth(query: string | null, now = new Date()) {
  return query === "all" ? undefined : query || currentTransactionMonth(now);
}
