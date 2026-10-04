export type AnnualBudgetInput={year:number;today:string;categories:{id:string;name:string}[];budgets:{month:string;categoryId:string;amount:number}[];moves:{month:string;fromCategoryId:string;toCategoryId:string;amount:number}[];expenses:{month:string;categoryId:string|null;amount:number}[]};
export function buildAnnualBudget(input:AnnualBudgetInput){
 const {year,today}=input,lastMonth=year<Number(today.slice(0,4))?12:year>Number(today.slice(0,4))?0:Number(today.slice(5,7));
 const months=Array.from({length:12},(_,i)=>({month:`${year}-${String(i+1).padStart(2,'0')}`,planned:0,actual:i<lastMonth?0:null as number|null,hasBudget:false}));
 const categories=new Map(input.categories.map(c=>[c.id,{...c,planned:0,actual:0,hasBudget:false}]));
 const get=(id:string|null)=>{const key=id||'uncategorized';if(!categories.has(key))categories.set(key,{id:key,name:id?'Deleted category':'Uncategorized',planned:0,actual:0,hasBudget:false});return categories.get(key)!;};
 const cents=(n:number)=>Math.round(n*100),slot=(m:string)=>months.find(r=>r.month===m);
 for(const b of input.budgets){const m=slot(b.month);if(!m)continue;m.planned+=cents(b.amount);m.hasBudget=true;if(m.actual!==null){const c=get(b.categoryId);c.planned+=cents(b.amount);c.hasBudget=true;}}
 for(const move of input.moves){const m=slot(move.month);if(!m||m.actual===null)continue;get(move.fromCategoryId).planned-=cents(move.amount);get(move.fromCategoryId).hasBudget=true;get(move.toCategoryId).planned+=cents(move.amount);get(move.toCategoryId).hasBudget=true;}
 for(const e of input.expenses){const m=slot(e.month);if(!m||m.actual===null)continue;m.actual+=cents(e.amount);get(e.categoryId).actual+=cents(e.amount);}
 const annualPlan=months.reduce((s,r)=>s+r.planned,0)/100,comparisonPlan=months.filter(r=>r.actual!==null).reduce((s,r)=>s+r.planned,0)/100,actual=months.reduce((s,r)=>s+(r.actual||0),0)/100;
 return {year,lastMonth,annualPlan,comparisonPlan,actual,remaining:comparisonPlan-actual,budgetMonths:months.filter(r=>r.hasBudget).length,comparedBudgetMonths:months.filter(r=>r.hasBudget&&r.actual!==null).length,months:months.map(r=>({...r,planned:r.planned/100,actual:r.actual===null?null:r.actual/100})),categories:[...categories.values()].filter(c=>c.hasBudget||c.actual!==0).map(c=>({...c,planned:c.planned/100,actual:c.actual/100,remaining:(c.planned-c.actual)/100})).sort((a,b)=>b.actual-a.actual||a.name.localeCompare(b.name))};
}
