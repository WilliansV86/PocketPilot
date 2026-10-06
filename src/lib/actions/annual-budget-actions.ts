"use server";
import { prisma } from '@/lib/db';
import { getDefaultUser } from '@/lib/get-default-user';
import { albertaDate } from '@/lib/recurring-calendar';
import { buildAnnualBudget } from '@/lib/annual-budget';
export async function getAnnualBudget(year:number,currency:string){
 try{
  if(!Number.isInteger(year)||year<1900||year>9998||!['USD','CAD'].includes(currency))throw new Error('Choose a valid year and currency');
  const user=await getDefaultUser(),today=albertaDate(),start=new Date(`${year}-01-01T00:00:00Z`),end=new Date(`${year+1}-01-01T00:00:00Z`),tomorrow=new Date(`${today}T00:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const [budgets,moves,expenses,categories,cardPlans,cardPayments]=await prisma.$transaction([
   prisma.budget.findMany({where:{userId:user.id,currency,month:{gte:`${year}-01`,lte:`${year}-12`},category:{group:{not:'INCOME'}}}}),
   prisma.budgetMove.findMany({where:{userId:user.id,currency,month:{gte:`${year}-01`,lte:`${year}-12`}}}),
   prisma.transaction.findMany({where:{userId:user.id,type:'EXPENSE',date:{gte:start,lt:end<tomorrow?end:tomorrow},OR:[{account:{currency}},{creditCard:{currency}}]},select:{date:true,amount:true,categoryId:true}}),
   prisma.category.findMany({where:{userId:user.id},select:{id:true,name:true}}),
   prisma.cardPaymentBudget.findMany({where:{userId:user.id,currency,month:{gte:`${year}-01`,lte:`${year}-12`}},select:{amount:true}}),
   prisma.transaction.findMany({where:{userId:user.id,type:'TRANSFER',debtPayment:{userId:user.id,currency,type:'CREDIT_CARD'},date:{gte:start,lt:end<tomorrow?end:tomorrow}},select:{amount:true}})
  ]);
  return {success:true,data:{...buildAnnualBudget({year,today,categories,budgets:budgets.map(b=>({...b,amount:Number(b.amount)})),moves:moves.map(m=>({...m,amount:Number(m.amount)})),expenses:expenses.map(t=>({month:t.date.toISOString().slice(0,7),categoryId:t.categoryId,amount:Math.abs(Number(t.amount))}))}),cardPayments:{extraAssigned:cardPlans.reduce((sum,p)=>sum+Math.round(Number(p.amount)*100),0)/100,paid:cardPayments.reduce((sum,p)=>sum+Math.round(Number(p.amount)*100),0)/100}}};
 }catch{return {success:false,error:'Annual budget report could not be loaded. Please retry.'};}
}
