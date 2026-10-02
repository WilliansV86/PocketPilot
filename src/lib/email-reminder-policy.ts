import type { DebtReminder } from "./debt-reminders";

export function selectEmailReminders(reminders: DebtReminder[]) {
  return reminders.filter(reminder =>
    reminder.kind === "PAYMENT_DUE" && reminder.daysUntil === 2,
  );
}
