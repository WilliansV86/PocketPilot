BEGIN;
SET LOCAL search_path TO public;
CREATE TABLE IF NOT EXISTS "Property" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "currency" TEXT NOT NULL DEFAULT 'USD',
 "estimatedValue" DECIMAL(12,2) NOT NULL,
 "mortgageDebtId" TEXT,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Property_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "Property_mortgageDebtId_fkey" FOREIGN KEY ("mortgageDebtId") REFERENCES "Debt"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Property_mortgageDebtId_key" ON "Property"("mortgageDebtId");
CREATE INDEX IF NOT EXISTS "Property_userId_currency_idx" ON "Property"("userId","currency");
COMMIT;
