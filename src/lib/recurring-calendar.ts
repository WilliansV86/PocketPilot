export function albertaDate(now = new Date()) {
 const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Edmonton",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const part = (key: string) => parts.find(p => p.type === key)!.value;
 return `${part("year")}-${part("month")}-${part("day")}`;
}
export function validDate(value: string) { const d = new Date(`${value}T12:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value; }
export function nextOccurrence(current: string, anchor: string, frequency: string) {
 if (!validDate(current) || !validDate(anchor)) throw new Error("Invalid date");
 const d = new Date(`${current}T12:00:00Z`), a = new Date(`${anchor}T12:00:00Z`);
 if (frequency === "WEEKLY" || frequency === "BIWEEKLY") d.setUTCDate(d.getUTCDate()+(frequency === "BIWEEKLY" ? 14 : 7));
 else {
  const step = frequency === "MONTHLY" ? 1 : frequency === "QUARTERLY" ? 3 : frequency === "YEARLY" ? 12 : 0;
  if (!step) throw new Error("Invalid frequency");
  const year=d.getUTCFullYear(), month=d.getUTCMonth()+step;
  d.setUTCDate(1); d.setUTCFullYear(year,month,Math.min(a.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate()));
 }
 return d.toISOString().slice(0,10);
}
