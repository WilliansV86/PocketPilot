import { Prisma, PrismaClient } from "@prisma/client";
import { getNetWorthBreakdown } from "@/lib/finance/net-worth";
import { albertaDate } from "@/lib/recurring-calendar";
export function historyMonth(value: string) {
 if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || Number(value.slice(0,4))<1900 || value>albertaDate().slice(0,7)) throw new Error("Choose the current month or an earlier month");
 return value;
}
export function historyAmount(value: unknown) {
 const text=String(value??'').trim();
 if(!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error("Enter a nonnegative amount with at most two decimals");
 const amount=new Prisma.Decimal(text);
 if(amount.gt('9999999999999999.99')) throw new Error("Amount is too large");
 return amount;
}
// The caller supplies an authenticated owner, or the scheduled personal-app owner.
// Every query is explicitly scoped; never reconstruct previous months from live balances.
export async function captureNetWorth(db:PrismaClient,userId:string,currency:string) {
 if(!userId || !['USD','CAD'].includes(currency))throw new Error("Invalid owner or currency");
 for(let attempt=0;attempt<3;attempt++) {
 try { return await db.$transaction(async tx=>{
  const month=albertaDate().slice(0,7);
  const old=await tx.netWorthSnapshot.findFirst({where:{userId,currency,month}});
  if(old?.source==='MANUAL')return old;
  const [accounts,debts,moneyOwed]=await Promise.all([
   tx.financialAccount.findMany({where:{userId,currency}}),
   tx.debt.findMany({where:{userId,currency}}),
   tx.moneyOwed.findMany({where:{userId,currency}})
  ]);
  const result=getNetWorthBreakdown({accounts,debts,moneyOwed});
  const data={assets:new Prisma.Decimal(result.assets.total.toFixed(2)),liabilities:new Prisma.Decimal(result.liabilities.total.toFixed(2)),capturedAt:new Date(),source:'AUTO'};
  return old?tx.netWorthSnapshot.update({where:{id:old.id,userId},data}):tx.netWorthSnapshot.create({data:{...data,userId,currency,month}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:10000,timeout:20000});
 }catch(e){if(!['P2034','P2002'].includes(String((e as {code?:string})?.code))||attempt===2)throw e;}
 }
 throw new Error("Unable to record snapshot");
}
