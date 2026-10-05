import spanish from "./es.json";
export type Language="en"|"es";
const dictionary:Record<string,string>=spanish;
const patterns: [RegExp,(m:RegExpMatchArray)=>string][] = [
 [/^(\d+) of 12 months have budgets$/,m=>`${m[1]} de 12 meses tienen presupuesto`],
 [/^Plan · (.*)$/,m=>`Plan · ${m[1]}`],
 [/^Spent · (.*)$/,m=>`Gastado · ${m[1]}`],
 [/^Received (.*) above the plan\.$/,m=>`Se recibieron ${m[1]} por encima del plan.`],
 [/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4}) · Monthly activity$/,m=>`${dictionary[m[1]]} de ${m[2]} · Actividad mensual`],
 [/^Payment due in (\d+) days?$/,m=>`El pago vence en ${m[1]} ${m[1]==="1"?"día":"días"}`],
 [/^Statement closes in (\d+) days?$/,m=>`El estado de cuenta cierra en ${m[1]} ${m[1]==="1"?"día":"días"}`],
 [/^(.*) remaining toward the minimum payment$/,m=>`${m[1]} pendientes del pago mínimo`],
 [/^Current balance is (.*)$/,m=>`El saldo actual es ${m[1]}`],
 [/^(\d+) active, (\d+) completed$/,m=>`${m[1]} activas, ${m[2]} completadas`],
 [/^Across (\d+) active goals$/,m=>`Entre ${m[1]} metas activas`],
 [/^Across (\d+) records$/,m=>`Entre ${m[1]} registros`],
 [/^(\d+) open debts$/,m=>`${m[1]} deudas activas`],
 [/^Payment of (.*?) made to (.*)$/,m=>`Pago de ${m[1]} realizado a ${m[2]}`],
 [/^Delete (.*?)\?$/,m=>`¿Eliminar ${m[1]}?`],
 [/^Edit (.*) balance$/,m=>`Editar el saldo de ${m[1]}`],
 [/^Open (.*?) menu$/,m=>`Abrir menú de ${dictionary[m[1]]??m[1]}`],
 [/^(.*?) pages$/,m=>`Páginas de ${dictionary[m[1]]??m[1]}`],
];
export function translate(text:string,language:Language):string{
 if(language!=="es"||!text)return text;
 const key=text.replace(/\s+/g," ").trim();const translated=dictionary[key] ?? (/^[a-z ]+$/.test(key) ? dictionary[key.toUpperCase()] : undefined);
 if(translated!==undefined)return (text.match(/^\s*/)?.[0]??"")+translated+(text.match(/\s*$/)?.[0]??"");
 for(const [pattern,render] of patterns){const match=key.match(pattern);if(match)return render(match);}
 const date=key.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(?: (\d{1,2}),?)?(?: (\d{4}))?$/);
 if(date)return (date[2]?`${date[2]} de `:"")+dictionary[date[1]]+(date[3]?` de ${date[3]}`:"");
 return text;
}
