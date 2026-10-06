-- Run ONLY in the database/schema used by the Preview DATABASE_URL.
-- In Neon SQL Editor, select that database and set search_path to that schema first.
-- Check before executing: SELECT current_database(), current_schema();
-- This is additive: no existing transactions, category plans, or balances are changed.
BEGIN;
CREATE TABLE IF NOT EXISTS "CardPaymentBudget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "debtId" TEXT NOT NULL REFERENCES "Debt"("id") ON DELETE CASCADE,
  "currency" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL CHECK ("amount" >= 0),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CardPaymentBudget_period_check" CHECK ("month" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT "CardPaymentBudget_userId_debtId_month_currency_key" UNIQUE ("userId", "debtId", "month", "currency")
);
CREATE INDEX IF NOT EXISTS "CardPaymentBudget_userId_currency_month_idx" ON "CardPaymentBudget"("userId", "currency", "month");
COMMIT;
