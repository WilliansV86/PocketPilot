"use client";
import { useEffect, useState } from "react";
import { recurringData, saveRecurring, toggleRecurring, recordDueRecurring, wiseTransfer } from "@/lib/actions/recurring-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import { toast } from "sonner";
import { CurrencyPicker, usePreferredCurrency } from "@/components/ui/currency-picker";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ReceiptText, PauseCircle, ArrowLeftRight, Plus, Wallet, CheckCircle2 } from "lucide-react";
import { statsDateLabel } from "@/lib/stats-date-range";
type Data=Awaited<ReturnType<typeof recurringData>>;
type Payment=Data['payments'][number];
const selectClass="h-11 w-full rounded-md border bg-background px-3 text-sm";
export function RecurringClient(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[editing,setEditing]=useState<Payment|null>(null),[formOpen,setFormOpen]=useState(false),[busy,setBusy]=useState(false),[source,setSource]=useState("");
 const [currency,setCurrency]=usePreferredCurrency("recurring");
 const [transferOpen,setTransferOpen]=useState(false),[fromId,setFromId]=useState(""),[toId,setToId]=useState("");
 const [notice,setNotice]=useState("");
 async function load(){try{setData(await recurringData());setError("");}catch{setError("Unable to load recurring payments. Check that the database update has been applied, then retry.");}}
 useEffect(()=>{void load();},[]);
 const field=(label:string,element:React.ReactNode)=><label className="grid gap-2 text-sm font-medium">{label}{element}</label>;
 if(!data)return <div className="rounded-xl border p-6 space-y-3"><p>{error||"Loading recurring payments…"}</p>{error&&<Button onClick={load}>Retry</Button>}</div>;
 const payments=data.payments.filter(p=>p.currency===currency);
 const upcoming=payments.filter(p=>p.active).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
 const horizon=new Date(`${data.today}T12:00:00Z`);horizon.setUTCDate(horizon.getUTCDate()+30);const end=horizon.toISOString().slice(0,10);
 let scheduledTotal=0;
 for(const p of upcoming){let date=p.nextDate,n=0;while(date<=end&&n++<200){scheduledTotal+=p.amount;date=nextOccurrence(date,p.anchorDate,p.frequency);}}
 const fromAccount=data.sources.find(a=>a.id===fromId),toAccount=data.sources.find(a=>a.id===toId);
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
 async function submit(form:FormData){setBusy(true);try{const result=await saveRecurring(form);if(!result.success){toast.error(result.error);return;}toast.success("Schedule saved");setNotice("Schedule saved. Your upcoming payments are updated.");setFormOpen(false);setEditing(null);await load();}catch{toast.error("Unable to save payment. Please try again.");}finally{setBusy(false);}}
 return <div className="pp-recurring-page space-y-5 p-4 md:p-6">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Recurring Payments</h1><p className="text-sm text-muted-foreground">Subscriptions and automatic bills, organized by payment source.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>{setFromId("");setToId("");setTransferOpen(true);}}><ArrowLeftRight className="mr-2 h-4 w-4"/>Transfer</Button><Button onClick={()=>open(null)} disabled={busy}><Plus className="mr-2 h-4 w-4"/>Add payment</Button></div></div>
  <div className="flex flex-wrap items-center justify-between gap-3"><CurrencyPicker value={currency} onChange={setCurrency} compact remember preferenceKey="recurring" disabled={busy}/><Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await recordDueRecurring();toast[r.failures.length?'error':'success'](r.failures.length?'Some schedules need review. Check their source and category.':`Recorded ${r.created} scheduled payments`);setNotice(r.failures.length?'Some payments could not be recorded. Check their source and category.':r.created?`${r.created} payments recorded. Balances and transactions are updated.`:'No unrecorded payments are due.');await load();}catch{toast.error("Could not process scheduled payments");}finally{setBusy(false);}}}><CheckCircle2 className="mr-2 h-4 w-4"/>{busy?'Working…':'Record due payments now'}</Button></div>
  {error&&<p role="alert" className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-600">{error}</p>}
  {notice&&<p role="status" className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-sm text-teal-700 dark:text-teal-400">{notice}</p>}
  <SummaryStrip items={[
   {label:'Active payments',value:upcoming.length,icon:ReceiptText},
   {label:'Next 30 days',value:formatMoney(Math.round(scheduledTotal*100)/100,currency),detail:'Bank and credit card charges',icon:Wallet},
   {label:'Next payment',value:upcoming[0]?statsDateLabel(upcoming[0].nextDate):'—',detail:upcoming[0]?.name||'No active payments',icon:CalendarDays},
   {label:'Paused',value:payments.filter(p=>!p.active).length,icon:PauseCircle}
  ]}/>
  <details className="rounded-lg border bg-card px-3 py-2 text-sm"><summary className="cursor-pointer text-muted-foreground">How automatic recording works</summary><p className="mt-2 text-muted-foreground">PocketPilot records expenses on their scheduled Alberta date; your bank handles actual autopay. Bank charges reduce account balances and credit card charges increase debt. Credit card repayments remain manual. Correct failed or changed charges in Transactions.</p></details>
  <section aria-label="Account funding for upcoming payments" className="grid gap-3 sm:grid-cols-2">{funding.map(s=><div key={s.id} className="rounded-xl border bg-card p-3"><h2 className="font-semibold">{s.name} · next 30 days</h2><p className="text-sm">Scheduled {formatMoney(s.total,currency)} · Available {formatMoney(s.balance,currency)}</p><p className={s.total>s.balance?'text-amber-600 font-medium':'text-emerald-600'}>{s.total>s.balance?`Funding needed: ${formatMoney(s.total-s.balance,currency)}`:'Current balance covers scheduled bills'}</p></div>)}</section>
  <Dialog open={formOpen} onOpenChange={value=>{if(!busy)setFormOpen(value);}}><DialogContent className="mx-0 w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto rounded-xl sm:max-w-2xl"><DialogHeader><DialogTitle>{editing?'Edit recurring payment':'Add recurring payment'}</DialogTitle><DialogDescription>Choose the amount, source and next unpaid date. Changes apply to future charges.</DialogDescription></DialogHeader><form key={editing?.id||'new'} onSubmit={event=>{event.preventDefault();void submit(new FormData(event.currentTarget));}} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={editing?.id||''}/>
   {field('Name',<Input name="name" required maxLength={150} defaultValue={editing?.name||''} placeholder="Netflix"/>)}
   {field('Amount',<Input name="amount" inputMode="decimal" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount} placeholder="0.00"/>)}
   {field('Paid from',<select name="sourceId" required className={selectClass} value={source} onChange={e=>setSource(e.target.value)}><option value="">Choose account or credit card</option>{data.sources.map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency}{s.card?' · Credit card':''}</option>)}</select>)}
   {field('Expense category',<select name="categoryId" required className={selectClass} defaultValue={editing?.categoryId||''}><option value="">Choose category</option>{data.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
   {field('Repeat',<select name="frequency" className={selectClass} defaultValue={editing?.frequency||'MONTHLY'}><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Every 3 months</option><option value="YEARLY">Yearly</option></select>)}
   {field('Next unpaid date',<Input name="nextDate" type="date" min={data.today} required defaultValue={editing?.nextDate&&editing.nextDate>=data.today?editing.nextDate:data.today}/>)}
   <p className="text-xs text-muted-foreground sm:col-span-2">Currency comes from the payment source. Dates such as the 31st move to the last day of shorter months and return to the 31st afterward. Editing applies to future entries; recorded transactions stay unchanged. Resuming skips dates while paused.</p>
   <div className="flex justify-end gap-2 border-t pt-3 sm:col-span-2"><Button disabled={busy} type="submit">{busy?'Saving…':'Save schedule'}</Button><Button disabled={busy} type="button" variant="outline" onClick={()=>setFormOpen(false)}>Cancel</Button></div>
  </form></DialogContent></Dialog>
  <section aria-label="Scheduled payments" className="grid gap-3 md:grid-cols-2">{payments.map(p=><article key={p.id} className={`min-w-0 rounded-xl border bg-card p-4 space-y-3 ${p.active?'border-l-4 border-l-teal-500':'border-l-4 border-l-muted-foreground/30'}`}>
   <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><span className="rounded-lg bg-teal-500/10 p-2 text-teal-700 dark:text-teal-400"><ReceiptText className="h-4 w-4"/></span><div className="min-w-0"><h2 className="font-semibold break-words">{p.name}</h2><p className="text-xs capitalize text-muted-foreground">{p.frequency==='QUARTERLY'?'Every 3 months':p.frequency.toLowerCase()}</p></div></div><strong className="shrink-0 text-lg tabular-nums">{formatMoney(p.amount,p.currency)}</strong></div>
   <p className="text-sm text-muted-foreground break-words">{data.sources.find(s=>s.id===p.sourceId)?.name||'Source needs review'}{p.sourceId.startsWith('card:')?' · Credit card':''}<span className="block text-xs mt-1">{data.categories.find(c=>c.id===p.categoryId)?.name||'Category needs review'}</span></p>
   <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><span className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-muted-foreground"/>{p.active?`Next: ${statsDateLabel(p.nextDate)}`:'Paused'}{p.active&&p.nextDate<data.today&&<Badge variant="outline" className="text-amber-600">Overdue recording</Badge>}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={()=>open(p)}>Edit</Button><Button size="sm" variant="outline" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await toggleRecurring(p.id,!p.active);if(!r.success)toast.error(r.error);else toast.success(p.active?'Payment paused':'Payment resumed');await load();}catch{toast.error('Unable to update payment');}finally{setBusy(false);}}}>{p.active?'Pause':'Resume'}</Button></div></div>
  </article>)}</section>
  {!payments.length&&<div className="rounded-xl border bg-card p-8 text-center"><ReceiptText className="mx-auto mb-3 h-7 w-7 text-teal-600"/><h2 className="font-semibold">No {currency} payments yet</h2><p className="mt-1 mb-4 text-sm text-muted-foreground">Add a subscription or automatic bill to get started.</p><Button onClick={()=>open(null)}>Add your first payment</Button></div>}
  <Dialog open={transferOpen} onOpenChange={value=>{if(!busy)setTransferOpen(value);}}><DialogContent className="mx-0 w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto rounded-xl sm:max-w-2xl"><DialogHeader><DialogTitle>Record a transfer</DialogTitle><DialogDescription>Move money between accounts or record a Wise currency conversion. Transfers are excluded from income and expenses.</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={async event=>{event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);try{const r=await wiseTransfer(form);if(r.success){setTransferOpen(false);setFromId('');setToId('');setNotice('Transfer recorded. Both account balances are updated.');toast.success('Transfer recorded');await load();}else toast.error(r.error);}catch{toast.error('Unable to record transfer');}finally{setBusy(false);}}}>
   {field('From account',<select name="from" required className={selectClass} value={fromId} onChange={e=>setFromId(e.target.value)}><option value="">Choose source</option>{data.sources.filter(s=>!s.card).map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency}</option>)}</select>)}
   {field('To account',<select name="to" required className={selectClass} value={toId} onChange={e=>setToId(e.target.value)}><option value="">Choose destination</option>{data.sources.filter(s=>!s.card).map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency}</option>)}</select>)}
   {field(`Amount sent${fromAccount?' · '+fromAccount.currency:''}`,<Input name="sent" required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"/>)}
   {field(`Amount received${toAccount?' · '+toAccount.currency:''}`,<Input name="received" required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00"/>)}
   {field('Transfer date',<Input name="date" type="date" defaultValue={data.today} required/>)}
   <details className="text-xs text-muted-foreground sm:col-span-2"><summary className="cursor-pointer">Wise accounts and fees</summary><p className="mt-2">For money held in Wise, create Wise CAD and Wise USD in Accounts. Record TD → Wise CAD, the conversion, then Wise USD → your US bank. Use actual deducted and received totals. Do not deduct a fee again if it is already included. To categorize it separately, exclude it from the transfer amount and record the fee as an expense.</p></details><div className="flex justify-end gap-2 border-t pt-3 sm:col-span-2"><Button disabled={busy} type="button" variant="outline" onClick={()=>setTransferOpen(false)}>Cancel</Button><Button disabled={busy} type="submit">{busy?'Recording…':'Record transfer'}</Button></div>
  </form></DialogContent></Dialog>
 </div>;
}
import { nextOccurrence } from "@/lib/recurring-calendar";
