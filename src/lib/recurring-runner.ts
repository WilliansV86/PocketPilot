import "server-only";
import { Prisma, PrismaClient } from "@prisma/client";
import { albertaDate, nextOccurrence } from "./recurring-calendar";
// All service operations explicitly scope both the schedule and its references to its owner.
export async function runRecurring(db: PrismaClient, userId?: string) {
 const today=albertaDate();
 const due=await db.recurringPayment.findMany({where:{active:true,nextDate:{lte:today},...(userId?{userId}:{})},orderBy:{nextDate:"asc"},take:100});
 let created=0; const failures: string[]=[];
 for(const item of due) {
  try {
   const count=await db.$transaction(async tx=>{
    const current=await tx.recurringPayment.findFirst({where:{id:item.id,userId:item.userId,active:true,nextDate:{lte:today}}});
    if(!current) return 0;
    const card=current.sourceId.startsWith("card:"); const id=card?current.sourceId.slice(5):current.sourceId;
    const source=card?await tx.debt.findFirst({where:{id,userId:current.userId,type:"CREDIT_CARD",isClosed:false}}):await tx.financialAccount.findFirst({where:{id,userId:current.userId}});
    const category=await tx.category.findFirst({where:{id:current.categoryId,userId:current.userId,isArchived:false,group:{not:"INCOME"}}});
    if(!source || source.currency!==current.currency || !category) throw new Error("Payment source or category needs updating");
    let date=current.nextDate,n=0,createdCount=0;
    while(date<=today && n<24){
     if(!await tx.recurringOccurrence.findUnique({where:{recurringId_scheduledDate:{recurringId:current.id,scheduledDate:date}}})) {
      const entry=await tx.transaction.create({data:{userId:current.userId,description:current.name,amount:current.amount,type:"EXPENSE",date:new Date(`${date}T12:00:00Z`),accountId:card?null:id,creditCardId:card?id:null,categoryId:current.categoryId,notes:`Scheduled autopay · ${date}. Recorded automatically; confirm against your statement.`}});
      createdCount++;
      await tx.recurringOccurrence.create({data:{userId:current.userId,recurringId:current.id,scheduledDate:date,transactionId:entry.id}});
      if(card) await tx.debt.update({where:{id},data:{currentBalance:{increment:current.amount}}});
      else await tx.financialAccount.update({where:{id},data:{balance:{decrement:current.amount}}});
     }
     date=nextOccurrence(date,current.anchorDate,current.frequency); n++;
    }
    await tx.recurringPayment.update({where:{id:current.id},data:{nextDate:date}}); return createdCount;
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:20000});
   created+=count;
  } catch { failures.push(item.id); }
 }
 return {created,failures};
}
