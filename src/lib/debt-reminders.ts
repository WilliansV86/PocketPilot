import { formatMoney } from "./currency";

export type ReminderKind = "PAYMENT_DUE" | "STATEMENT_CLOSING";

export type DebtReminderSource = {
  id: string;
  name: string;
  currency?: string;
  type: string;
  lender?: string | null;
  currentBalance: number;
  minimumPayment?: number | null;
  minimumPaymentPaid?: number | null;
  dueDayOfMonth?: number | null;
  statementClosingDay?: number | null;
};

export type DebtReminder = {
  id: string;
  debtId: string;
  kind: ReminderKind;
  name: string;
  currency?: string;
  lender?: string | null;
  date: string;
  daysUntil: number;
  amount?: number;
  title: string;
  detail: string;
};

function atLocalNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function dateForMonth(year: number, month: number, day: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay), 12);
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextMonthlyOccurrence(dayOfMonth: number, from = new Date()) {
  const today = atLocalNoon(from);
  let result = dateForMonth(today.getFullYear(), today.getMonth(), dayOfMonth);

  if (result < today) {
    result = dateForMonth(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  }

  return result;
}

export function daysUntil(date: Date, from = new Date()) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((atLocalNoon(date).getTime() - atLocalNoon(from).getTime()) / millisecondsPerDay);
}

export function paymentCycleKey(dueDayOfMonth: number, from = new Date()) {
  return toLocalDateKey(nextMonthlyOccurrence(dueDayOfMonth, from));
}

export function buildDebtReminders(
  debts: DebtReminderSource[],
  from = new Date(),
  horizonDays = 31,
) {
  const reminders: DebtReminder[] = [];

  for (const debt of debts) {
    if (debt.dueDayOfMonth) {
      const dueDate = nextMonthlyOccurrence(debt.dueDayOfMonth, from);
      const dueIn = daysUntil(dueDate, from);
      const minimum = debt.minimumPayment || 0;
      const paid = debt.minimumPaymentPaid || 0;
      const remaining = Math.max(minimum - paid, 0);

      if (dueIn <= horizonDays && (minimum === 0 || remaining > 0)) {
        reminders.push({
          id: `${debt.id}-payment-${toLocalDateKey(dueDate)}`,
          debtId: debt.id,
          kind: "PAYMENT_DUE",
          name: debt.name,
          currency: debt.currency || "USD",
          lender: debt.lender,
          date: toLocalDateKey(dueDate),
          daysUntil: dueIn,
          amount: remaining || minimum,
          title: dueIn === 0 ? "Payment due today" : `Payment due in ${dueIn} day${dueIn === 1 ? "" : "s"}`,
          detail: minimum > 0
            ? `${formatMoney(remaining, debt.currency)} remaining toward the minimum payment`
            : "Review the amount due for this debt",
        });
      }
    }

    if (debt.type === "CREDIT_CARD" && debt.statementClosingDay) {
      const closingDate = nextMonthlyOccurrence(debt.statementClosingDay, from);
      const closesIn = daysUntil(closingDate, from);

      if (closesIn <= horizonDays) {
        reminders.push({
          id: `${debt.id}-statement-${toLocalDateKey(closingDate)}`,
          debtId: debt.id,
          kind: "STATEMENT_CLOSING",
          name: debt.name,
          currency: debt.currency || "USD",
          lender: debt.lender,
          date: toLocalDateKey(closingDate),
          daysUntil: closesIn,
          title: closesIn === 0
            ? "Statement closes today"
            : `Statement closes in ${closesIn} day${closesIn === 1 ? "" : "s"}`,
          detail: `Current balance is ${formatMoney(debt.currentBalance, debt.currency)}`,
        });
      }
    }
  }

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
}
