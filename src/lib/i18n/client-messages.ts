"use client";
import { toast } from "sonner";
import { translate } from "./translate";
function text(value:unknown){return typeof value==="string"?translate(value,typeof document!=="undefined"&&document.documentElement.lang==="es"?"es":"en"):value;}
function options(value:any){return value&&typeof value==="object"?{...value,description:text(value.description)}:value;}
export const localizedToast = new Proxy(toast,{
 apply(target,thisArg,args){return Reflect.apply(target,thisArg,[text(args[0]),options(args[1])]);},
 get(target,key){const value=Reflect.get(target,key);if(["success","error","info","warning","message","loading"].includes(String(key))&&typeof value==="function")return (message:unknown,opts:any)=>value(text(message),options(opts));return value;},
}) as typeof toast;
export function localizedConfirm(message:string){return window.confirm(String(text(message)));}
