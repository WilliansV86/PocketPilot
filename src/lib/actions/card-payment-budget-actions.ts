'use server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getDefaultUser } from '@/lib/get-default-user';

const allocationSchema = z.object({
  debtId:z.string().min(1), month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),currency:z.enum(['USD','CAD']),
  amount:z.number().finite().min(0).max(9999999999.99).refine(n=>Math.abs(n*100-Math.round(n*100))<0.00001,'Use at most two decimal places'),
});
export async function saveCardPaymentBudget(debtId:string,month:string,currency:string,amount:number) {
  try {
    const data=allocationSchema.parse({debtId,month,currency,amount}),user=await getDefaultUser();
    await prisma.$transaction(async tx=>{
      const card=await tx.debt.findFirst({where:{id:data.debtId,userId:user.id,currency:data.currency,type:'CREDIT_CARD'}});
      if(!card || (card.isClosed && data.amount > 0))throw new Error('Select an open credit card in this currency');
      await tx.cardPaymentBudget.upsert({where:{userId_debtId_month_currency:{userId:user.id,debtId:data.debtId,month:data.month,currency:data.currency}},
        create:{userId:user.id,...data},update:{amount:data.amount}});
    },{isolationLevel:'Serializable'});
    // Return a fresh view without replacing the route or moving scroll position.
    return {success:true};
  } catch(error) {
    console.error('Card budget save failed',error);
    return {success:false,error:error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error && error.message==='Select an open credit card in this currency' ? error.message : 'Could not save the card payment budget. Check the setup and try again.'};
  }
}
