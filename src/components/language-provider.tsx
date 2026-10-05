"use client";
import { createContext, useContext, useEffect, ReactNode } from "react";
import { translate, Language } from "@/lib/i18n/translate";
const LanguageContext=createContext<Language>("en");
export function LanguageProvider({language,children}:{language:Language;children:ReactNode}){
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const language=useContext(LanguageContext);return {language,locale:language==="es"?"es-CA":"en-CA",t:(text:string)=>translate(text,language)};}
export function I18nText({text}:{text:ReactNode}){const {t}=useLanguage();return <>{typeof text === "string" ? t(text) : text}</>;}
