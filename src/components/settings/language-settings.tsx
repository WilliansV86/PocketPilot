"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { saveLanguage } from "@/lib/actions/language-actions";
export function LanguageSettings(){const {language,t}=useLanguage();const [choice,setChoice]=useState(language),[busy,setBusy]=useState(false),[error,setError]=useState("");const router=useRouter();
 async function save(){setBusy(true);setError("");const r=await saveLanguage(choice);if(r.success){router.refresh();}else setError(r.error??"Unable to save language. Please try again.");setBusy(false);}
 return <section className="max-w-xl rounded-2xl border bg-card p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-teal-500/10 p-2 text-teal-700 dark:text-teal-400"><Languages className="h-5 w-5"/></span><h2 className="text-lg font-semibold">{t("App language")}</h2></div><p className="mt-3 text-sm text-muted-foreground">{t("Your language is saved to your PocketPilot account. Currency and your financial records stay unchanged.")}</p><label className="mt-5 block text-sm font-medium" htmlFor="app-language">{t("Language")}</label><select id="app-language" className="mt-2 h-11 w-full rounded-lg border bg-background px-3" value={choice} disabled={busy} onChange={e=>setChoice(e.target.value as "en"|"es")}><option value="en">English</option><option value="es">Español</option></select>{error&&<p role="alert" className="mt-3 text-sm text-red-600">{t(error)}</p>}<Button className="mt-4" onClick={save} disabled={busy||choice===language}>{t(busy?"Saving…":"Save language")}</Button></section>;
}
