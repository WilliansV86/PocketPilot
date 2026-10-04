"use server";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { runRecurring } from "@/lib/recurring-runner";
import { albertaDate, validDate, nextOccurrence } from "@/lib/recurring-calendar";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
const money=(v:unknown)=>{const n=Number(v); if(!Number.isFinite(n)||n<=0||n>9999999999.99||Math.abs(n*100-Math.round(n*100))>0.00001) throw new Error("Enter a positive amount with at most two decimals");return n;};
function refresh(){for(const p of ["/recurring","/transactions","/accounts","/debts","/budgets","/stats","/"]) revalidatePath(p);}
export async function recurringData(){
 const user=await getDefaultUser();
 const [payments,accounts,cards,categories]=await Promise.all([
 prisma.recurringPayment.findMany({where:{userId:user.id},orderBy:{nextDate:"asc"}}),
 prisma.financialAccount.findMany({where:{userId:user.id},orderBy:{name:"asc"}}),
 prisma.debt.findMany({where:{userId:user.id,type:"CREDIT_CARD",isClosed:false},orderBy:{name:"asc"}}),
 prisma.category.findMany({where:{userId:user.id,isArchived:false,group:{not:"INCOME"}},orderBy:{name:"asc"}})]);
 return {payments:payments.map(p=>({...p,amount:Number(p.amount)})),sources:[...accounts.map(a=>({id:a.id,name:a.name,currency:a.currency,balance:Number(a.balance),card:false})),...cards.map(a=>({id:`card:${a.id}`,name:a.name,currency:a.currency,balance:0,card:true}))],categories:categories.map(c=>({id:c.id,name:c.name})),today:albertaDate()};
}
export async function saveRecurring(form:FormData){
 try {
 const user=await getDefaultUser(),id=String(form.get("id")||""),sourceId=String(form.get("sourceId")||""),categoryId=String(form.get("categoryId")||""),nextDate=String(form.get("nextDate")||""),frequency=String(form.get("frequency")||""),name=String(form.get("name")||"").trim();
 if(!name||name.length>150||!validDate(nextDate)||!['WEEKLY','MONTHLY','QUARTERLY','YEARLY'].includes(frequency)) throw new Error("Check name, date and frequency");
 if(nextDate<albertaDate()) throw new Error("Choose today or a future date; historical charges should be recorded manually");
 const amount=money(form.get("amount"));
 await prisma.$transaction(async tx=>{
 const source=sourceId.startsWith("card:")?await tx.debt.findFirst({where:{id:sourceId.slice(5),userId:user.id,type:"CREDIT_CARD",isClosed:false}}):await tx.financialAccount.findFirst({where:{id:sourceId,userId:user.id}});
 if(!source||!await tx.category.findFirst({where:{id:categoryId,userId:user.id,isArchived:false,group:{not:"INCOME"}}})) throw new Error("Select a payment source and expense category");
 const data={name,amount,currency:source.currency,sourceId,categoryId,frequency,anchorDate:nextDate,nextDate};
 if(id){const old=await tx.recurringPayment.findFirst({where:{id,userId:user.id}});if(!old)throw new Error("Schedule not found");if(await tx.recurringOccurrence.findFirst({where:{userId:user.id,recurringId:id,scheduledDate:nextDate}}))throw new Error("That date was already recorded; choose the next unpaid date");await tx.recurringPayment.update({where:{id,userId:user.id},data});}
 else await tx.recurringPayment.create({data:{...data,userId:user.id}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 refresh();return {success:true};
 }catch(e){return {success:false,error:e instanceof Error&&!('code' in e)?e.message:"Unable to save schedule"};}
}
export async function toggleRecurring(id:string,active:boolean){try{const user=await getDefaultUser();await prisma.$transaction(async tx=>{const p=await tx.recurringPayment.findFirst({where:{id,userId:user.id}});if(!p)throw new Error("Schedule not found");let nextDate=p.nextDate;if(active){let n=0;while(nextDate<albertaDate()&&n++<5000)nextDate=nextOccurrence(nextDate,p.anchorDate,p.frequency);if(nextDate<albertaDate())throw new Error("Edit the next date before resuming");}await tx.recurringPayment.update({where:{id,userId:user.id},data:{active,nextDate}});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});refresh();return {success:true};}catch{return {success:false,error:"Unable to update schedule"};}}
export async function recordDueRecurring(){const user=await getDefaultUser();const result=await runRecurring(prisma,user.id);refresh();return result;}
export async function wiseTransfer(form:FormData){
 try{const user=await getDefaultUser(),from=String(form.get("from")||""),to=String(form.get("to")||""),date=String(form.get("date")||""),sent=money(form.get("sent")),received=money(form.get("received"));
 if(from===to||!validDate(date))throw new Error("Choose different accounts and a valid date");
 const international=form.get("transferKind")==="INTERNATIONAL";
 const provider=international?String(form.get("provider")||"").trim():"";
 if(international&&(!provider||provider.length>80))throw new Error("Enter the transfer provider name");
 await prisma.$transaction(async tx=>{
 const a=await tx.financialAccount.findFirst({where:{id:from,userId:user.id}}),b=await tx.financialAccount.findFirst({where:{id:to,userId:user.id}});
 if(!a||!b)throw new Error("Account not found");
 if(international){const direction=String(form.get("direction")||"");if(!['CAD-USD','USD-CAD'].includes(direction)||`${a.currency}-${b.currency}`!==direction)throw new Error("Choose accounts matching the selected Canada/US direction");}if(a.currency===b.currency&&sent!==received)throw new Error("For a same-currency transfer, use equal amounts and record any fee separately");
 await tx.transaction.create({data:{userId:user.id,type:"TRANSFER",accountId:from,toAccountId:to,amount:sent,toAmount:received,description:`${international?provider+" transfer":"Transfer"}: ${a.name} → ${b.name}`,date:new Date(`${date}T12:00:00Z`),notes:`${international?"Provider: "+provider+". ":""}${sent} ${a.currency} deducted; ${received} ${b.currency} received. Any fee included in these amounts is already reflected in balances.`}});
 await tx.financialAccount.update({where:{id:from},data:{balance:{decrement:sent}}});await tx.financialAccount.update({where:{id:to},data:{balance:{increment:received}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});refresh();return {success:true};
 }catch(e){return {success:false,error:e instanceof Error&&!('code' in e)?e.message:"Unable to record transfer"};}
}
