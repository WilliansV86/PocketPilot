import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCardPaymentBudgets, type CardBudgetInput } from '../src/lib/card-payment-budget';
const card=(balance=2000)=>({id:'card',name:'Test card',currentBalance:balance,isClosed:false});
function tx(id:string,amount:number,month='2026-10',creditCardId:string|null='card',type='EXPENSE',categoryId:string|null='food') {
  return {id,amount,date:`${month}-10T12:00:00.000Z`,createdAt:`${month}-10T12:00:00.000Z`,creditCardId,type,categoryId,debtPaymentId:null};
}
function payment(id:string,amount:number,month='2026-10') {return {...tx(id,amount,month,null,'TRANSFER',null),date:`${month}-20T12:00:00.000Z`,debtPaymentId:'card'};}
function base(partial:Partial<CardBudgetInput>={}):CardBudgetInput {return {month:'2026-10',cards:[card()],budgets:[],moves:[],allocations:[],transactions:[],...partial};}
const plan=(amount:number,month='2026-10')=>({month,categoryId:'food',amount});
const extra=(amount:number,month='2026-10')=>({month,debtId:'card',amount});
test('opening debt is not spending and requires an extra plan',()=>{
  const [r]=buildCardPaymentBudgets(base());assert.equal(r.balance,2000);assert.equal(r.fromPurchases,0);assert.equal(r.unreservedDebt,2000);
});
test('funded purchase plus extra debt allocation, followed by one payment',()=>{
  const [r]=buildCardPaymentBudgets(base({cards:[card(1800)],budgets:[plan(300)],allocations:[extra(200)],transactions:[tx('buy',300),payment('pay',500)]}));
  assert.equal(r.fromPurchases,300);assert.equal(r.assigned,200);assert.equal(r.paid,500);assert.equal(r.available,0);assert.equal(r.shortfall,0);assert.equal(r.balance,1800);
});
test('old debt payment consumes extra allocation only',()=>{
 const [r]=buildCardPaymentBudgets(base({cards:[card(1800)],allocations:[extra(200)],transactions:[payment('pay',200)]}));
 assert.equal(r.fromPurchases,0);assert.equal(r.shortfall,0);assert.equal(r.unreservedDebt,1800);
});
test('reserve carries into the following month without budgeting the purchase twice',()=>{
 const [r]=buildCardPaymentBudgets(base({month:'2026-11',cards:[card(2000)],budgets:[plan(300)],transactions:[tx('buy',300),payment('pay',300,'2026-11')]}));
 assert.equal(r.carried,300);assert.equal(r.fromPurchases,0);assert.equal(r.paid,300);assert.equal(r.available,0);assert.equal(r.balance,2000);
});
test('overspending reserves only the funded portion',()=>{
 const [r]=buildCardPaymentBudgets(base({cards:[card(2500)],budgets:[plan(300)],transactions:[tx('buy',500)]}));
 assert.equal(r.available,300);assert.equal(r.unfundedPurchases,200);assert.equal(r.unreservedDebt,2200);
});
test('cash purchase and card purchase share the same category funds',()=>{
 const cash={...tx('cash',150,'2026-10',null),date:'2026-10-09T12:00:00Z'};
 const [r]=buildCardPaymentBudgets(base({budgets:[plan(300)],transactions:[tx('card',250),cash]}));
 assert.equal(r.fromPurchases,150);assert.equal(r.unfundedPurchases,100);
});
test('multiple cards cannot reserve the same category money twice',()=>{
 const [a,b]=buildCardPaymentBudgets(base({cards:[card(),{...card(),id:'other'}],budgets:[plan(300)],transactions:[tx('a',200),tx('b',200,'2026-10','other')]}));
 assert.equal(a.fromPurchases+b.fromPurchases,300);assert.equal(b.unfundedPurchases,100);
});
test('payment shortfall carries forward and later extra funds cover it',()=>{
 const [r]=buildCardPaymentBudgets(base({month:'2026-11',allocations:[extra(200,'2026-11')],transactions:[payment('pay',200)]}));
 assert.equal(r.carried,-200);assert.equal(r.assigned,200);assert.equal(r.available,0);assert.equal(r.shortfall,0);
});
test('unfunded payment shows a shortage instead of becoming an expense',()=>{
 const [r]=buildCardPaymentBudgets(base({transactions:[payment('pay',200)]}));assert.equal(r.shortfall,200);assert.equal(r.fromPurchases,0);
});
test('edits and deletions replay rather than accumulate stale reservations',()=>{
 const first=buildCardPaymentBudgets(base({budgets:[plan(300)],transactions:[tx('buy',300)]}))[0];
 const edited=buildCardPaymentBudgets(base({budgets:[plan(300)],transactions:[tx('buy',100)]}))[0];
 const deleted=buildCardPaymentBudgets(base({budgets:[plan(300)]}))[0];
 assert.equal(first.available,300);assert.equal(edited.available,100);assert.equal(deleted.available,0);
});
test('edited or deleted payment adjusts the reserve',()=>{
 const common={budgets:[plan(300)],allocations:[extra(200)]};
 const edited=buildCardPaymentBudgets(base({...common,transactions:[tx('buy',300),payment('pay',100)]}))[0];
 const deleted=buildCardPaymentBudgets(base({...common,transactions:[tx('buy',300)]}))[0];
 assert.equal(edited.available,400);assert.equal(deleted.available,500);
});
test('changing a category budget or moving money recomputes purchase funding',()=>{
 const [r]=buildCardPaymentBudgets(base({budgets:[plan(300)],moves:[{month:'2026-10',fromCategoryId:'food',toCategoryId:'rent',amount:100}],transactions:[tx('buy',300)]}));
 assert.equal(r.fromPurchases,200);assert.equal(r.unfundedPurchases,100);
});
test('future transactions do not contaminate historical month-end balances',()=>{
 const [r]=buildCardPaymentBudgets(base({cards:[card(2400)],transactions:[tx('future',400,'2026-11')]}));
 assert.equal(r.balance,2000);assert.equal(r.fromPurchases,0);
});
test('future allocations are not reserved early',()=>{
 const [r]=buildCardPaymentBudgets(base({allocations:[extra(200,'2026-11')]}));assert.equal(r.available,0);assert.equal(r.assigned,0);
});
test('uncategorized purchases create debt but no reservation',()=>{
 const [r]=buildCardPaymentBudgets(base({transactions:[tx('buy',50,'2026-10','card','EXPENSE',null)]}));
 assert.equal(r.available,0);assert.equal(r.unfundedPurchases,50);
});
test('cents remain exact',()=>{
 const [r]=buildCardPaymentBudgets(base({budgets:[plan(0.3)],transactions:[tx('a',0.1),tx('b',0.2)]}));assert.equal(r.available,0.3);
});
test('closed cards with a reserve remain visible',()=>{
 const [r]=buildCardPaymentBudgets(base({cards:[{...card(),isClosed:true}],allocations:[extra(100)]}));assert.equal(r.available,100);
});
test('over-reserving is visible so cash can be released',()=>{
 const [r]=buildCardPaymentBudgets(base({cards:[card(100)],allocations:[extra(200)]}));assert.equal(r.overReserved,100);
});
test('category plans reset monthly while payment reserves persist',()=>{
 const [r]=buildCardPaymentBudgets(base({month:'2026-11',budgets:[plan(300)],transactions:[tx('old',100),tx('new',100,'2026-11')]}));
 assert.equal(r.carried,100);assert.equal(r.fromPurchases,0);assert.equal(r.unfundedPurchases,100);
});
test('input ordering does not change deterministic results',()=>{
 const data=base({budgets:[plan(300)],transactions:[tx('b',200),tx('a',200)]});
 assert.deepEqual(buildCardPaymentBudgets(data),buildCardPaymentBudgets({...data,transactions:[...data.transactions].reverse()}));
});

test('cash spending entered after a card purchase releases overlapping reserve',()=>{
 const cash={...tx('cash',100,'2026-10',null),date:'2026-10-15T12:00:00Z'};
 const [r]=buildCardPaymentBudgets(base({budgets:[plan(300)],transactions:[tx('buy',300),cash]}));
 assert.equal(r.fromPurchases,200);assert.equal(r.unfundedPurchases,100);
});
test('late cash overspending reveals a shortage on a payment already recorded',()=>{
 const cash={...tx('cash',100,'2026-10',null),date:'2026-10-25T12:00:00Z'};
 const [r]=buildCardPaymentBudgets(base({budgets:[plan(300)],transactions:[tx('buy',300),payment('pay',300),cash]}));
 assert.equal(r.shortfall,100);
});
