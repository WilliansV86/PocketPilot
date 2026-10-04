BEGIN;
SET LOCAL search_path TO public;
DO $$ BEGIN
 IF to_regclass('public."User"') IS NULL THEN
  RAISE EXCEPTION 'PocketPilot User table not found in public. Check the selected Neon branch/database.';
 END IF;
END $$;

-- CreateTable
CREATE TABLE "MonthlyIncomePlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyIncomePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyIncomePlan_userId_currency_month_key" ON "MonthlyIncomePlan"("userId", "currency", "month");

-- AddForeignKey
ALTER TABLE "MonthlyIncomePlan" ADD CONSTRAINT "MonthlyIncomePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
