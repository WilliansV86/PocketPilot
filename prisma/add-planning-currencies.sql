-- Preserve all records and amounts. Existing planning records become USD.
BEGIN;
ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "BudgetMove" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "MoneyOwed" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
-- Permit a USD and CAD budget for the same category/month.
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_userId_categoryId_month_currency_key"
  ON "Budget" ("userId", "categoryId", "month", "currency");
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "Budget_userId_categoryId_month_key";
DROP INDEX IF EXISTS "Budget_userId_categoryId_month_key";
COMMIT;
