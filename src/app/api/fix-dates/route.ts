import { fixTransactionDates } from "@/lib/actions/fix-transaction-dates";

export async function GET() {
  const result = await fixTransactionDates();
  
  return Response.json(result);
}
