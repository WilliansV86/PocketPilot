// Keep corrections in whole cents so repayment totals do not drift.
export function correctedReceivable(original: number, payments: number[]) {
  function cents(amount: number) {
    const rounded = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(rounded) || Math.abs(amount * 100 - rounded) > 0.000001) {
      throw new Error("Amounts must be valid money values with at most two decimal places.");
    }
    return rounded;
  }
  const amount = cents(original);
  if (amount <= 0) throw new Error("Original amount must be positive.");
  const paid = payments.reduce((sum, payment) => sum + cents(payment), 0);
  if (!Number.isSafeInteger(paid)) throw new Error("Payment total is too large.");
  if (amount < paid) throw new Error("Original amount cannot be less than the total already repaid.");
  const outstanding = amount - paid;
  return { amountOriginal: amount / 100, amountOutstanding: outstanding / 100,
    status: outstanding === 0 ? "PAID" as const : paid > 0 ? "PARTIAL" as const : "OPEN" as const };
}
