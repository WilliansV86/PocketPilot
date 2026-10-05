"use server";
import { getDefaultUser } from "@/lib/get-default-user";
import { servicePrisma } from "@/lib/db-service";
import { revalidatePath } from "next/cache";
export async function saveLanguage(language:string){
 if(language!=="en"&&language!=="es")return {success:false,error:"Choose English or Spanish."};
 try{const user=await getDefaultUser();await servicePrisma.user.update({where:{id:user.id},data:{language}});revalidatePath("/","layout");return {success:true};}
 catch{return {success:false,error:"Unable to save language. Please try again."};}
}
