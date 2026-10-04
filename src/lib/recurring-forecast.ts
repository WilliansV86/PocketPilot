import {nextOccurrence,validDate} from './recurring-calendar';
type Schedule={id:string;name:string;sourceId:string;currency:string;amount:number;nextDate:string;anchorDate:string;frequency:string;active:boolean};
type Source={id:string;name:string;currency:string;balance:number;card:boolean};
export function recurringForecast(payments:Schedule[],sources:Source[],currency:string,today:string,days:number){
 if(!validDate(today)||![14,30,60].includes(days))throw new Error('Invalid forecast period');
 const d=new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);const end=d.toISOString().slice(0,10);
 const events:{date:string;name:string;sourceId:string;amount:number;id:string}[]=[];const invalid:string[]=[];
 for(const p of payments.filter(p=>p.active&&p.currency===currency)){
  try{if(!Number.isFinite(p.amount)||p.amount<=0||!sources.some(s=>s.id===p.sourceId&&s.currency===currency))throw Error();let date=p.nextDate,n=0;while(date<=end){if(++n>5000)throw Error();const next=nextOccurrence(date,p.anchorDate,p.frequency);events.push({date,name:p.name,sourceId:p.sourceId,amount:Math.round(p.amount*100),id:p.id});date=next;}}
  catch{invalid.push(p.name);for(let i=events.length-1;i>=0;i--)if(events[i].id===p.id)events.splice(i,1);}
 }
 events.sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
 const banks=sources.filter(s=>!s.card&&s.currency===currency).map(s=>{let projected=Math.round(s.balance*100);let firstShortfall:string|null=null;const entries=events.filter(e=>e.sourceId===s.id).map(e=>{projected-=e.amount;if(projected<0&&!firstShortfall)firstShortfall=e.date;return {...e,amount:e.amount/100,projected:projected/100,overdue:e.date<today};});const total=entries.reduce((sum,e)=>sum+Math.round(e.amount*100),0);return {...s,total:total/100,projected:projected/100,needed:Math.max(0,-projected)/100,firstShortfall:firstShortfall as string|null,entries};}).filter(s=>s.entries.length>0);
 const cardIds=new Set(sources.filter(s=>s.card&&s.currency===currency).map(s=>s.id));
 const cardCharges=events.filter(e=>cardIds.has(e.sourceId)).reduce((sum,e)=>sum+e.amount,0)/100;
 return {end,days,banks,cardCharges,invalid};
}
