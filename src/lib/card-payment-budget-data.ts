import { prisma } from '@/lib/db';
import { buildCardPaymentBudgets } from './card-payment-budget';

export async function loadCardPaymentBudgets(userId: string, month: string, currency: string) {
  // Read one consistent snapshot; replay all source records to preserve reversibility.
  const [cards, budgets, moves, allocations, transactions] = await prisma.$transaction([
    prisma.debt.findMany({ where:{userId,currency,type:'CREDIT_CARD'}, orderBy:{name:'asc'}, select:{id:true,name:true,currentBalance:true,isClosed:true} }),
    prisma.budget.findMany({where:{userId,currency,month:{lte:month},category:{userId,group:{not:'INCOME'}}},select:{month:true,categoryId:true,amount:true}}),
    prisma.budgetMove.findMany({where:{userId,currency,month:{lte:month}},select:{month:true,fromCategoryId:true,toCategoryId:true,amount:true}}),
    prisma.cardPaymentBudget.findMany({where:{userId,currency,month:{lte:month}},select:{month:true,debtId:true,amount:true}}),
    prisma.transaction.findMany({where:{userId,OR:[{account:{currency}},{creditCard:{currency}},{debtPayment:{currency,type:'CREDIT_CARD'}}]},select:{id:true,date:true,createdAt:true,type:true,amount:true,categoryId:true,creditCardId:true,debtPaymentId:true}}),
  ], { isolationLevel: "RepeatableRead" });
  return buildCardPaymentBudgets({month,cards:cards.map(c=>({...c,currentBalance:Number(c.currentBalance)})),
    budgets:budgets.map(b=>({...b,amount:Number(b.amount)})),moves:moves.map(m=>({...m,amount:Number(m.amount)})),
    allocations:allocations.map(a=>({...a,amount:Number(a.amount)})),
    transactions:transactions.map(t=>({...t,date:t.date.toISOString(),createdAt:t.createdAt.toISOString(),amount:Number(t.amount)})),
  });
}
