-- Additive only. Existing debts are USD; no balances are converted or removed.
ALTER TABLE "Debt"
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
