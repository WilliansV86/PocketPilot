BEGIN;
SET LOCAL search_path TO public;
DO $$ BEGIN
 IF to_regclass('public."User"') IS NULL THEN
  RAISE EXCEPTION 'PocketPilot User table not found in public. Check the selected Neon branch/database.';
 END IF;
END $$;

-- CreateTable
CREATE TABLE "NetWorthSnapshot" (
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
CREATE UNIQUE INDEX "NetWorthSnapshot_userId_currency_month_key" ON "NetWorthSnapshot"("userId", "currency", "month");

-- AddForeignKey
ALTER TABLE "NetWorthSnapshot" ADD CONSTRAINT "NetWorthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
