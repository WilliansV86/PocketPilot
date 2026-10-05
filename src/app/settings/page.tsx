import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LanguageSettings } from "@/components/settings/language-settings";
import { I18nText } from "@/components/language-provider";
export default async function SettingsPage(){return <DashboardLayout title="Settings"><div className="space-y-5"><h1 className="text-2xl font-semibold"><I18nText text="Settings"/></h1><LanguageSettings/></div></DashboardLayout>;}
