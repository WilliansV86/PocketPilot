"use server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";

const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a nonnegative amount with at most two decimals")
 .refine(v => new Prisma.Decimal(v).lte("9999999999.99"), "Amount is too large");
const schema = z.object({name:z.string().trim().min(1).max(100),currency:z.enum(["USD","CAD"]),estimatedValue:money,mortgageBalance:money,mortgageDebtId:z.string()});
function refresh(){for(const p of ["/accounts","/dashboard","/","/debts"])revalidatePath(p);}
export async function getProperties(){
 try{const user=await getDefaultUser();const [properties,mortgages]=await Promise.all([
 prisma.property.findMany({where:{userId:user.id},include:{mortgageDebt:true},orderBy:{name:"asc"}}),
 prisma.debt.findMany({where:{userId:user.id,type:"MORTGAGE",isClosed:false},orderBy:{name:"asc"}})]);
 return {success:true as const,data:properties.map(p=>({id:p.id,name:p.name,currency:p.currency,estimatedValue:Number(p.estimatedValue),mortgageDebtId:p.mortgageDebtId,mortgageBalance:p.mortgageDebt&&!p.mortgageDebt.isClosed?Number(p.mortgageDebt.currentBalance):0})),mortgages:mortgages.map(d=>({id:d.id,name:d.name,currency:d.currency,balance:Number(d.currentBalance)}))};
 }catch{ return {success:false as const,error:"Unable to load properties. Check that the property database update has been applied."};}
}
export async function saveProperty(id:string|null,form:FormData){
 try{const v=schema.parse(Object.fromEntries(form));const user=await getDefaultUser();
 await prisma.$transaction(async tx=>{
 const old=id?await tx.property.findFirst({where:{id,userId:user.id}}):null;
 if(id&&!old)throw new Error("Property not found");
 if(old&&old.currency!==v.currency)throw new Error("Keep the existing property currency");
 let mortgageDebtId=old?.mortgageDebtId??null;
 if(old&&v.mortgageDebtId!==(old.mortgageDebtId??""))throw new Error("Keep the linked mortgage; edit it in Debts if needed");
 if(!old&&v.mortgageDebtId){
 const d=await tx.debt.findFirst({where:{id:v.mortgageDebtId,userId:user.id,type:"MORTGAGE",currency:v.currency,isClosed:false}});
 if(!d)throw new Error("Choose your mortgage in the same currency");
 if(await tx.property.findFirst({where:{mortgageDebtId:d.id}}))throw new Error("That mortgage is already linked to a property");
 mortgageDebtId=d.id;
 }else if(mortgageDebtId){
 const d=await tx.debt.findFirst({where:{id:mortgageDebtId,userId:user.id,type:"MORTGAGE",currency:v.currency}});
 if(!d)throw new Error("Linked mortgage not found");
 // Editing a property value leaves its mortgage balance untouched. Mortgage
 // corrections and repayments use the existing Debts workflow.
 }else if(new Prisma.Decimal(v.mortgageBalance).gt(0)){
 const d=await tx.debt.create({data:{userId:user.id,name:`${v.name} mortgage`,type:"MORTGAGE",currency:v.currency,currentBalance:new Prisma.Decimal(v.mortgageBalance)}});mortgageDebtId=d.id;
 }
 const data={name:v.name,currency:v.currency,estimatedValue:new Prisma.Decimal(v.estimatedValue),mortgageDebtId};
 if(old)await tx.property.update({where:{id:old.id,userId:user.id},data});else await tx.property.create({data:{...data,userId:user.id}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:10000,timeout:20000});refresh();return {success:true as const};
 }catch(e){return {success:false as const,error:e instanceof z.ZodError?e.issues[0].message:e instanceof Error?e.message:"Unable to save property"};}
}
export async function deleteProperty(id:string){try{const user=await getDefaultUser();await prisma.property.delete({where:{id,userId:user.id}});refresh();return {success:true as const};}catch{return {success:false as const,error:"Unable to remove property"};}}
