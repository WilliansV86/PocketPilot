-- Additive only: does not modify existing accounts, debts, or users.
CREATE TABLE IF NOT EXISTS "DebtReminderDelivery" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "debtId" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "errorCode" TEXT,
  CONSTRAINT "DebtReminderDelivery_user_debt_due_key" UNIQUE ("userId", "debtId", "dueDate")
);
