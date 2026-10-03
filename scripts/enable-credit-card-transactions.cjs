/* Additive migration: run once after applying the patch. Never use db push/reset. */
const { Client } = require("pg");
(async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  const url = new URL(process.env.DATABASE_URL);
  const schema = url.searchParams.get("schema") || "public";
  url.searchParams.delete("schema");
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    const quotedSchema = '"' + schema.replaceAll('"', '""') + '"';
    await client.query("SELECT set_config('search_path', $1, false)", [quotedSchema]);
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    // Confirm the intended schema; never create replacement finance tables.
    const check = await client.query(`SELECT to_regclass('"Transaction"') AS transactions, to_regclass('"Debt"') AS debts`);
    if (!check.rows[0].transactions || !check.rows[0].debts) throw new Error("Finance tables not found in the configured database schema");
    await client.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "creditCardId" TEXT');
    await client.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "debtPaymentId" TEXT');
    await client.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "debtPaymentCycle" TEXT');
    await client.query('ALTER TABLE "Transaction" ALTER COLUMN "accountId" DROP NOT NULL');
    await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_debtPaymentId_fkey' AND conrelid = '"Transaction"'::regclass) THEN
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_debtPaymentId_fkey" FOREIGN KEY ("debtPaymentId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_creditCardId_fkey' AND conrelid = '"Transaction"'::regclass) THEN
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "Debt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_payment_source_check' AND conrelid = '"Transaction"'::regclass) THEN
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payment_source_check" CHECK (
          ("accountId" IS NOT NULL AND "creditCardId" IS NULL) OR
          ("accountId" IS NULL AND "creditCardId" IS NOT NULL AND "type" = 'EXPENSE' AND "toAccountId" IS NULL)
        );
      END IF;
    END $$`);
    await client.query('CREATE INDEX IF NOT EXISTS "Transaction_creditCardId_idx" ON "Transaction" ("creditCardId")');
    await client.query("COMMIT");
    console.log("SUCCESS: Credit-card transaction support enabled. Existing transactions and balances were not changed.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    // Avoid exposing connection strings or server error detail.
    console.error("Migration failed; changes rolled back:", error.code || error.message);
    process.exitCode = 1;
  } finally { await client.end(); }
})().catch(() => { console.error("Migration could not start. Check DATABASE_URL and try again."); process.exitCode = 1; });
