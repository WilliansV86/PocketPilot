import { getDefaultUser } from "@/lib/get-default-user";
import { servicePrisma } from "@/lib/db-service";
export const dynamic = "force-dynamic";
export async function GET() {
 try { await getDefaultUser(); } catch { return Response.json({error:"Sign in first"},{status:401}); }
 try {
  const url = new URL(process.env.DATABASE_URL || "");
  const schema = url.searchParams.get("schema") || "public";
  const rows = await servicePrisma.$queryRaw<{database:string;recurringPayment:boolean;recurringOccurrence:boolean;receivedAmountColumn:boolean}[]>`
   SELECT current_database() AS database,
   EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema=${schema} AND table_name='RecurringPayment') AS "recurringPayment",
   EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema=${schema} AND table_name='RecurringOccurrence') AS "recurringOccurrence",
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=${schema} AND table_name='Transaction' AND column_name='toAmount') AS "receivedAmountColumn"`;
  return Response.json({hostname:url.hostname,schema,...rows[0]},{headers:{"Cache-Control":"no-store"}});
 } catch { return Response.json({error:"Unable to check database connection"},{status:500,headers:{"Cache-Control":"no-store"}}); }
}
