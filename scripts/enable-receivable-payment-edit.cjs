const { Client } = require("pg");
(async () => {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is missing");
  const url = new URL(raw); const schema = url.searchParams.get("schema") || "public"; url.searchParams.delete("schema");
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query("SELECT set_config('search_path', $1, false)", ['"' + schema.replaceAll('"', '""') + '"']);
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query('ALTER TABLE "MoneyOwedPayment" ADD COLUMN IF NOT EXISTS "transactionId" TEXT');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "MoneyOwedPayment_transactionId_key" ON "MoneyOwedPayment" ("transactionId")');
    await client.query("COMMIT");
    console.log("SUCCESS: Payment editing enabled. Existing payments and balances were preserved.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Payment editing setup failed:", error.code || "Check the database connection."); process.exitCode = 1;
  } finally { await client.end(); }
})().catch(() => { console.error("Payment editing setup failed. Check DATABASE_URL."); process.exitCode = 1; });
