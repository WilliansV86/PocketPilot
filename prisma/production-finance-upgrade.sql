BEGIN;
SET LOCAL search_path TO public;
DO $$ BEGIN
 IF to_regclass('public."User"') IS NULL THEN
  RAISE EXCEPTION 'PocketPilot User table not found in public. Check the selected Neon production branch/database.';
 END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "NetWorthSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "assets" DECIMAL(18,2) NOT NULL,
    "liabilities" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'AUTO',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NetWorthSnapshot_userId_currency_month_key" ON "NetWorthSnapshot"("userId", "currency", "month");

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NetWorthSnapshot_userId_fkey' AND conrelid = 'public."NetWorthSnapshot"'::regclass) THEN
  ALTER TABLE "NetWorthSnapshot" ADD CONSTRAINT "NetWorthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;


-- CreateTable
CREATE TABLE IF NOT EXISTS "MonthlyIncomePlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyIncomePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyIncomePlan_userId_currency_month_key" ON "MonthlyIncomePlan"("userId", "currency", "month");

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MonthlyIncomePlan_userId_fkey' AND conrelid = 'public."MonthlyIncomePlan"'::regclass) THEN
  ALTER TABLE "MonthlyIncomePlan" ADD CONSTRAINT "MonthlyIncomePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;


COMMIT;
