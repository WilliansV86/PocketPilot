'use client';
import { useState } from 'react';
import { ChevronDown, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { I18nText, useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/currency';
import { localizedToast as toast } from '@/lib/i18n/client-messages';
import { saveCardPaymentBudget } from '@/lib/actions/card-payment-budget-actions';
import type { CardPaymentBudgetRow } from '@/lib/card-payment-budget';

export function CardPaymentBudgets({cards=[],month,currency,onSaved}:{cards?:CardPaymentBudgetRow[];month:string;currency:string;onSaved:()=>Promise<void>}) {
  const {t}=useLanguage();
  const [editing,setEditing]=useState<string|null>(null),[value,setValue]=useState(''),[busy,setBusy]=useState(false);
  const money=(n:number)=>formatMoney(n,currency);
  async function save(id:string) {
    if(!value.trim() || !/^\d+(\.\d{1,2})?$/.test(value.trim())) { toast.error('Enter an amount with up to two decimal places');return; }
    setBusy(true);
    try {
      const result=await saveCardPaymentBudget(id,month,currency,Number(value));
      if(!result.success){toast.error(result.error || 'Could not save the card payment budget');return;}
      await onSaved();setEditing(null);toast.success('Card payment allocation saved');
    } catch {toast.error('Could not refresh the budget. Reload before making another change.');}
    finally {setBusy(false);}
  }
  if(!cards.length)return null;
  const totalAvailable=cards.reduce((total,card)=>total+card.available,0);
  const totalShortfall=cards.reduce((total,card)=>total+card.shortfall,0);
  return <details className="group/payment-section overflow-hidden rounded-xl border border-l-4 border-l-teal-500 bg-card">
    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 bg-teal-50/70 p-3 md:p-4 dark:bg-teal-950/20 [&::-webkit-details-marker]:hidden">
      <div className="min-w-0"><h2 className="flex items-center gap-2 text-sm font-semibold md:text-base"><CreditCard aria-hidden="true" className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400"/><I18nText text="Credit card payments"/></h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{cards.length} <I18nText text="cards"/>{totalShortfall>0&&<span className="ml-2 text-red-600 dark:text-red-400"><I18nText text="Budget gap"/>: {money(totalShortfall)}</span>}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2"><div className="text-right"><p className="text-xs text-muted-foreground"><I18nText text="Available to pay"/></p><p className="text-sm font-semibold tabular-nums">{money(totalAvailable)}</p></div><ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-open/payment-section:rotate-180"/></div>
    </summary>
    <div className="space-y-3 border-t p-3 md:p-4">
      <p className="text-xs text-muted-foreground"><I18nText text="Money set aside for card payments. Budgeted card purchases add money automatically; budget for debt repayment to cover older debt. Paying the card uses this money and stays a transfer."/></p>
      <p className="text-xs text-muted-foreground"><I18nText text="This is planned money, not your bank balance. Budget each repayment here only once."/></p>
      <div className="space-y-2">{cards.map(card=><details key={card.id} className="group/payment-card min-w-0 rounded-lg border">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 p-3 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0"><h3 className="break-words text-sm font-semibold">{card.name}</h3><p className="mt-0.5 text-xs text-muted-foreground"><I18nText text="Debt repayment budget"/>: {money(card.assigned)}</p>{card.shortfall>0&&<p className="mt-0.5 text-xs text-red-600 dark:text-red-400"><I18nText text="Budget gap"/>: {money(card.shortfall)}</p>}{(card.unfundedPurchases>0||card.overReserved>0)&&<p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400"><I18nText text="Review funding details"/></p>}</div>
          <div className="flex shrink-0 items-center gap-2"><div className="text-right"><p className="text-xs text-muted-foreground"><I18nText text="Available to pay"/></p><p className="text-sm font-semibold tabular-nums">{money(card.available)}</p></div><ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-transform group-open/payment-card:rotate-180"/></div>
        </summary>
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground"><I18nText text="Balance at month end"/>: {money(card.balance)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {[['Carried over',card.carried],['Reserved from purchases',card.fromPurchases],['Debt repayment budget',card.assigned],['Paid this month',card.paid]].map(([label,amount])=><div key={String(label)}><dt className="text-muted-foreground"><I18nText text={String(label)}/></dt><dd className="mt-0.5 font-medium tabular-nums">{money(Number(amount))}</dd></div>)}
      </dl>
      {card.shortfall>0&&<p role="status" className="mt-2 text-xs text-red-600 dark:text-red-400"><I18nText text="Budget gap"/>: {money(card.shortfall)}. <I18nText text="You paid more than you set aside. Budget for debt repayment to cover the gap; the payment itself is already recorded."/></p>}
      {card.unfundedPurchases>0&&<p className="mt-2 text-xs text-amber-700 dark:text-amber-400"><I18nText text="Purchases without category funding"/>: {money(card.unfundedPurchases)}. <I18nText text="Cover the original spending category or assign extra here."/></p>}
      {card.overReserved>0&&<p className="mt-2 text-xs text-amber-700 dark:text-amber-400"><I18nText text="Reserved above the remaining balance"/>: {money(card.overReserved)}. <I18nText text="Reduce an extra allocation if you no longer need it."/></p>}
      <p className="mt-2 text-xs text-muted-foreground"><I18nText text="Debt not yet reserved"/>: {money(card.unreservedDebt)}</p>
      {editing===card.id?<form className="mt-3 space-y-2 border-t pt-3" onSubmit={e=>{e.preventDefault();void save(card.id);}}>
        <label className="block text-xs"><I18nText text="Debt repayment budget this month"/> ({currency})<Input value={value} onChange={e=>setValue(e.target.value)} inputMode="decimal" disabled={busy} className="mt-1 h-11" autoFocus required /></label>
        <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy}><I18nText text={busy?'Saving…':'Save'}/></Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={()=>setEditing(null)}><I18nText text="Cancel"/></Button></div>
      </form>:<div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={()=>{setEditing(card.id);setValue(card.isClosed ? '0.00' : card.assigned.toFixed(2));}}><I18nText text="Budget for debt repayment"/></Button><Button asChild size="sm" variant="ghost"><Link href="/debts"><I18nText text="Record payment in Debts"/></Link></Button></div>}
        </div>
      </details>)}</div>
    </div>
  </details>;
}
