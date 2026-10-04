"use client";
import { useEffect, useState } from "react";
import { recurringData, saveRecurring, toggleRecurring, recordDueRecurring, wiseTransfer } from "@/lib/actions/recurring-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import { toast } from "sonner";
type Data=Awaited<ReturnType<typeof recurringData>>;
type Payment=Data['payments'][number];
const selectClass="h-11 w-full rounded-md border bg-background px-3 text-sm";
export function RecurringClient(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[editing,setEditing]=useState<Payment|null>(null),[formOpen,setFormOpen]=useState(false),[busy,setBusy]=useState(false),[currency,setCurrency]=useState("CAD"),[source,setSource]=useState("");
 async function load(){try{setData(await recurringData());setError("");}catch{setError("Unable to load recurring payments. Check that the database update has been applied, then retry.");}}
 useEffect(()=>{void load();},[]);
 const field=(label:string,element:React.ReactNode)=><label className="grid gap-2 text-sm font-medium">{label}{element}</label>;
 if(!data)return <div className="p-4">{error||"Loading recurring payments…"}{error&&<Button onClick={load}>Retry</Button>}</div>;
 const payments=data.payments.filter(p=>p.currency===currency);
 const upcoming=payments.filter(p=>p.active).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
 const horizon=new Date(`${data.today}T12:00:00Z`);horizon.setUTCDate(horizon.getUTCDate()+30);const end=horizon.toISOString().slice(0,10);
 // Each source is evaluated independently: money at Chase cannot fund a Wells Fargo debit.
 const funding=data.sources.filter(s=>!s.card&&s.currency===currency).map(s=>{
  let total=0;
  for(const p of upcoming.filter(p=>p.sourceId===s.id)){
   let date=p.nextDate,n=0;
   while(date<=end&&n++<200){total+=p.amount;date=nextOccurrence(date,p.anchorDate,p.frequency);}
  }
  return {...s,total:Math.round(total*100)/100};
 }).filter(s=>s.total>0);
 function open(p:Payment|null){setEditing(p);setSource(p?.sourceId||"");setFormOpen(true);}
 async function submit(form:FormData){setBusy(true);try{const result=await saveRecurring(form);if(!result.success){toast.error(result.error);return;}toast.success("Schedule saved");setFormOpen(false);setEditing(null);await load();}finally{setBusy(false);}}
 return <div className="space-y-5 p-4 md:p-6 max-w-6xl mx-auto">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Recurring Payments</h1><p className="text-sm text-muted-foreground">Subscriptions and automatic bills · Alberta dates</p></div><Button onClick={()=>open(null)}>+ Add payment</Button></div>
  <p className="rounded-lg border p-3 text-sm text-muted-foreground">PocketPilot records scheduled expenses; your bank handles the actual autopay. Credit card repayments remain manual. Correct any failed or changed charge in Transactions.</p>
  <div className="flex flex-wrap gap-3 items-center"><select aria-label="Currency" className={selectClass+" max-w-40"} value={currency} onChange={e=>setCurrency(e.target.value)}><option>CAD</option><option>USD</option></select><Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await recordDueRecurring();toast[r.failures.length?'error':'success'](r.failures.length?'Some schedules need review. Check their source and category.':`Processed ${r.created} scheduled entries`);await load();}catch{toast.error("Could not process scheduled payments");}finally{setBusy(false);}}}>Record due payments now</Button></div>
  <section className="grid gap-3 sm:grid-cols-2">{funding.map(s=><div key={s.id} className="rounded-xl border p-4"><h2 className="font-semibold">{s.name} · next 30 days</h2><p className="text-sm">Scheduled {formatMoney(s.total,currency)} · Available {formatMoney(s.balance,currency)}</p><p className={s.total>s.balance?'text-amber-600 font-medium':'text-emerald-600'}>{s.total>s.balance?`Funding needed: ${formatMoney(s.total-s.balance,currency)}`:'Current balance covers scheduled bills'}</p></div>)}</section>
  {formOpen&&<section className="rounded-xl border p-4 space-y-3"><h2 className="font-semibold">{editing?'Edit payment':'New payment'}</h2><form key={editing?.id||'new'} action={submit} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={editing?.id||''}/>
   {field('Name',<Input name="name" required maxLength={150} defaultValue={editing?.name||''} placeholder="Netflix"/>)}
   {field('Amount',<Input name="amount" inputMode="decimal" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount} placeholder="0.00"/>)}
   {field('Paid from',<select name="sourceId" required className={selectClass} value={source} onChange={e=>setSource(e.target.value)}><option value="">Choose account or credit card</option>{data.sources.map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency}{s.card?' · Credit card':''}</option>)}</select>)}
   {field('Expense category',<select name="categoryId" required className={selectClass} defaultValue={editing?.categoryId||''}><option value="">Choose category</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
   {field('Repeat',<select name="frequency" className={selectClass} defaultValue={editing?.frequency||'MONTHLY'}><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Every 3 months</option><option value="YEARLY">Yearly</option></select>)}
   {field('Next unpaid date',<Input name="nextDate" type="date" min={data.today} required defaultValue={editing?.nextDate&&editing.nextDate>=data.today?editing.nextDate:data.today}/>)}
   <p className="text-xs text-muted-foreground sm:col-span-2">Currency comes from the payment source. Dates such as the 31st move to the last day of shorter months and return to the 31st afterward. Editing applies to future entries; recorded transactions stay unchanged. Resuming skips dates while paused.</p>
   <div className="flex gap-2"><Button disabled={busy} type="submit">{busy?'Saving…':'Save schedule'}</Button><Button type="button" variant="outline" onClick={()=>setFormOpen(false)}>Cancel</Button></div>
  </form></section>}
  <section className="grid gap-3 md:grid-cols-2">{payments.map(p=><article key={p.id} className="rounded-xl border p-4 space-y-2 opacity-100"><div className="flex justify-between gap-3"><h2 className="font-semibold break-words">{p.name}</h2><strong className="shrink-0">{formatMoney(p.amount,p.currency)}</strong></div><p className="text-sm text-muted-foreground">{data.sources.find(s=>s.id===p.sourceId)?.name||'Source needs review'} · {data.categories.find(c=>c.id===p.categoryId)?.name||'Category needs review'}</p><p className="text-sm">{p.frequency.toLowerCase()} · {p.active?`Next: ${p.nextDate}`:'Paused'}{p.active&&p.nextDate<data.today?' · Processing overdue':''}</p><div className="flex gap-2"><Button variant="outline" onClick={()=>open(p)}>Edit</Button><Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await toggleRecurring(p.id,!p.active);if(!r.success)toast.error(r.error);await load();}finally{setBusy(false);}}}>{p.active?'Pause':'Resume'}</Button></div></article>)}</section>
  {!payments.length&&<p className="rounded-xl border p-4 text-muted-foreground">No {currency} recurring payments yet.</p>}
  <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Wise & account transfers</summary><div className="mt-4 space-y-3"><p className="text-sm text-muted-foreground">Create Wise CAD and Wise USD in Accounts if you want to track money held in Wise. Record TD → Wise CAD, the currency conversion, then Wise USD → Chase or Wells Fargo. Transfers do not count as spending.</p><form className="grid gap-4 sm:grid-cols-2" action={async form=>{setBusy(true);try{const r=await wiseTransfer(form);if(r.success){toast.success('Transfer recorded');await load();}else toast.error(r.error);}finally{setBusy(false);}}}>
   {field('From account',<select name="from" required className={selectClass}><option value="">Choose source</option>{data.sources.filter(s=>!s.card).map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency}</option>)}</select>)}
   {field('To account',<select name="to" required className={selectClass}><option value="">Choose destination</option>{data.sources.filter(s=>!s.card).map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency}</option>)}</select>)}
   {field('Actual amount deducted (source currency)',<Input name="sent" required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"/>)}
   {field('Actual amount received (destination currency)',<Input name="received" required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"/>)}
   {field('Transfer date',<Input name="date" type="date" defaultValue={data.today} required/>)}
   <p className="text-xs text-muted-foreground">Use the actual totals from Wise. Fees included in the deducted amount are already reflected in your balances; do not add another deduction for the same fee. To categorize a fee separately, record the transfer excluding that fee and add its expense separately.</p><Button disabled={busy} type="submit">Record transfer</Button>
  </form></div></details>
 </div>;
}
import { nextOccurrence } from "@/lib/recurring-calendar";
