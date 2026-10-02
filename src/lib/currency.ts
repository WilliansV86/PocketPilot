export function formatMoney(amount: number, currency = "USD"): string {
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const prefix = currency === "CAD" ? "CA$" : currency === "USD" ? "US$" : `${currency} `;
  return `${amount < 0 ? "-" : ""}${prefix}${number}`;
}
