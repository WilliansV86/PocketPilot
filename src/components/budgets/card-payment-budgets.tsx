'use client';
import { useState } from 'react';
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
  return <section aria-label={t('Credit card payments')} className="space-y-3 rounded-xl border p-3 md:p-4">
    <div><h2 className="text-base font-semibold"><I18nText text="Credit card payments"/></h2>
      <p className="mt-1 text-xs text-muted-foreground"><I18nText text="Budgeted purchases reserve money here automatically. Assign extra for older debt or a payment shortfall. Payments remain transfers, not new expenses."/></p>
      <p className="mt-1 text-xs text-muted-foreground"><I18nText text="These are planned funds, not a separate bank balance. Keep your category budgets backed by cash. Do not budget the same card repayment again under Debt."/></p>
    </div>
    <div className="grid gap-3 lg:grid-cols-2">{cards.map(card=><article key={card.id} className="min-w-0 rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{card.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground"><I18nText text="Balance at month end"/>: {money(card.balance)}</p></div>
        <div className="shrink-0 text-right"><p className="text-xs text-muted-foreground"><I18nText text="Available to pay"/></p><p className="text-base font-semibold tabular-nums">{money(card.available)}</p></div></div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {[['Carried over',card.carried],['Reserved from purchases',card.fromPurchases],['Extra assigned',card.assigned],['Paid this month',card.paid]].map(([label,amount])=><div key={String(label)}><dt className="text-muted-foreground"><I18nText text={String(label)}/></dt><dd className="mt-0.5 font-medium tabular-nums">{money(Number(amount))}</dd></div>)}
      </dl>
      {card.shortfall>0&&<p role="status" className="mt-2 text-xs text-red-600 dark:text-red-400"><I18nText text="Payment shortfall"/>: {money(card.shortfall)}. <I18nText text="Payments exceeded the reserved plan. Assign extra to cover this."/></p>}
      {card.unfundedPurchases>0&&<p className="mt-2 text-xs text-amber-700 dark:text-amber-400"><I18nText text="Purchases without category funding"/>: {money(card.unfundedPurchases)}. <I18nText text="Cover the original spending category or assign extra here."/></p>}
      {card.overReserved>0&&<p className="mt-2 text-xs text-amber-700 dark:text-amber-400"><I18nText text="Reserved above the remaining balance"/>: {money(card.overReserved)}. <I18nText text="Reduce an extra allocation if you no longer need it."/></p>}
      <p className="mt-2 text-xs text-muted-foreground"><I18nText text="Debt not yet reserved"/>: {money(card.unreservedDebt)}</p>
      {editing===card.id?<form className="mt-3 space-y-2 border-t pt-3" onSubmit={e=>{e.preventDefault();void save(card.id);}}>
        <label className="block text-xs"><I18nText text="Extra assigned this month"/> ({currency})<Input value={value} onChange={e=>setValue(e.target.value)} inputMode="decimal" disabled={busy} className="mt-1 h-11" autoFocus required /></label>
        <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy}><I18nText text={busy?'Saving…':'Save'}/></Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={()=>setEditing(null)}><I18nText text="Cancel"/></Button></div>
      </form>:<div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={()=>{setEditing(card.id);setValue(card.isClosed ? '0.00' : card.assigned.toFixed(2));}}><I18nText text="Assign extra"/></Button><Button asChild size="sm" variant="ghost"><Link href="/debts"><I18nText text="Record payment in Debts"/></Link></Button></div>}
    </article>)}</div>
  </section>;
}
