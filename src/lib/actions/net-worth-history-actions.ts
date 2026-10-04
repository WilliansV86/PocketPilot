"use server";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { captureNetWorth, historyAmount, historyMonth } from "@/lib/net-worth-history";
function message(e:unknown){const code=(e as {code?:string})?.code;return ['P2021','P2022'].includes(code||'')?'Net-worth history needs its database setup. Your other dashboard information is unaffected.':e instanceof Error&&!code?e.message:'Unable to update net-worth history. Please retry.';}
export async function getNetWorthHistory(currency:string,throughMonth:string){
 try{
  if(!['USD','CAD'].includes(currency))throw new Error('Choose USD or CAD');
  const month=historyMonth(throughMonth),user=await getDefaultUser();
  await captureNetWorth(prisma,user.id,currency);
  const rows=await prisma.netWorthSnapshot.findMany({where:{userId:user.id,currency,month:{lte:month}},orderBy:{month:'desc'},take:12});
  return {success:true,rows:rows.reverse().map(r=>({id:r.id,month:r.month,assets:Number(r.assets),liabilities:Number(r.liabilities),netWorth:Number(r.assets)-Number(r.liabilities),source:r.source,capturedAt:r.capturedAt.toISOString()}))};
 }catch(e){return {success:false,error:message(e),rows:[]};}
}
export async function saveNetWorthHistory(form:FormData){
 try{
  const user=await getDefaultUser(),currency=String(form.get('currency')),month=historyMonth(String(form.get('month')));
  if(!['USD','CAD'].includes(currency))throw new Error('Choose USD or CAD');
  const assets=historyAmount(form.get('assets')),liabilities=historyAmount(form.get('liabilities'));
  await prisma.netWorthSnapshot.upsert({where:{userId_currency_month:{userId:user.id,currency,month}},create:{userId:user.id,currency,month,assets,liabilities,source:'MANUAL',capturedAt:new Date()},update:{assets,liabilities,source:'MANUAL',capturedAt:new Date()}});
  return {success:true};
 }catch(e){return {success:false,error:message(e)};}
}
export async function useAutomaticNetWorth(currency:string){
 try{
  if(!['USD','CAD'].includes(currency))throw new Error('Choose USD or CAD');
  const user=await getDefaultUser();
  // Explicitly remove the manual override for this month only.
  const {albertaDate}=await import('@/lib/recurring-calendar');
  await prisma.netWorthSnapshot.updateMany({where:{userId:user.id,currency,month:albertaDate().slice(0,7)},data:{source:'AUTO'}});
  await captureNetWorth(prisma,user.id,currency);return {success:true};
 }catch(e){return {success:false,error:message(e)};}
}
