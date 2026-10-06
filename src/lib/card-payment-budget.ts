/** Planning ledger, in cents. No account/debt balances are written here.
 * Cash spending has first claim on a monthly category plan; remaining funds
 * cover card purchases in date/creation/id order. This prevents cash overspending
 * from leaving the same money reserved on a card. Only funded card purchases reserve money.
 * Category plans reset monthly; card reserves and payment shortages carry over.
 * Replaying source records makes edits/deletions/backdated entries reversible.
 */
export type CardBudgetInput = {
  month: string;
  cards: { id: string; name: string; currentBalance: number; isClosed: boolean }[];
  budgets: { month: string; categoryId: string; amount: number }[];
  moves: { month: string; fromCategoryId: string; toCategoryId: string; amount: number }[];
  allocations: { month: string; debtId: string; amount: number }[];
  transactions: { id: string; date: string; createdAt: string; type: string; amount: number;
    categoryId: string | null; creditCardId: string | null; debtPaymentId: string | null }[];
};
export type CardPaymentBudgetRow = {
  id: string; name: string; isClosed: boolean; balance: number; assigned: number;
  carried: number; fromPurchases: number; paid: number; available: number;
  shortfall: number; unreservedDebt: number; overReserved: number; unfundedPurchases: number;
};
function cents(amount: number) {
  if (!Number.isFinite(amount) || Math.abs(amount) > 9999999999.99) throw new Error('Invalid ledger amount');
  return Math.round(amount * 100);
}
export function buildCardPaymentBudgets(input: CardBudgetInput): CardPaymentBudgetRow[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) throw new Error('Invalid month');
  const states = new Map(input.cards.map(card => [card.id, {
    ...card, reserve: 0, carried: 0, assigned: 0, fromPurchases: 0, paid: 0, unfundedPurchases: 0,
    // Current stored debt includes every recorded purchase/payment, including future dates.
    balance: cents(card.currentBalance),
  }]));
  const allTransactions = [...input.transactions].sort((a,b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const t of allTransactions) {
    const purchase = t.creditCardId && states.get(t.creditCardId);
    if (purchase && t.type === 'EXPENSE') purchase.balance -= cents(t.amount);
    const payment = t.debtPaymentId && states.get(t.debtPaymentId);
    if (payment && t.type === 'TRANSFER') payment.balance += cents(t.amount);
  }
  const pools = new Map<string, number>();
  const key = (month: string, categoryId: string) => `${month}:${categoryId}`;
  for (const b of input.budgets) pools.set(key(b.month,b.categoryId), (pools.get(key(b.month,b.categoryId)) || 0) + cents(b.amount));
  for (const m of input.moves) {
    pools.set(key(m.month,m.fromCategoryId), (pools.get(key(m.month,m.fromCategoryId)) || 0) - cents(m.amount));
    pools.set(key(m.month,m.toCategoryId), (pools.get(key(m.month,m.toCategoryId)) || 0) + cents(m.amount));
  }
  const transactions = allTransactions.filter(t => t.date.slice(0,7) <= input.month);
  // Cash has already left the bank. Reserve only what remains after all cash
  // spending in that category/month, even when entered after the card purchase.
  for (const t of transactions) {
    if (t.type === 'EXPENSE' && !t.creditCardId && t.categoryId) {
      const poolKey = key(t.date.slice(0,7), t.categoryId);
      pools.set(poolKey, (pools.get(poolKey) || 0) - cents(t.amount));
    }
  }
  const months = new Set([input.month, ...transactions.map(t=>t.date.slice(0,7)), ...input.allocations.filter(a=>a.month<=input.month).map(a=>a.month)]);
  for (const month of [...months].sort()) {
    if (month === input.month) for (const state of states.values()) state.carried = state.reserve;
    for (const a of input.allocations.filter(a=>a.month===month)) {
      const state = states.get(a.debtId); if (!state) continue;
      state.reserve += cents(a.amount);
      if (month===input.month) state.assigned += cents(a.amount);
    }
    for (const t of transactions.filter(t=>t.date.slice(0,7)===month)) {
      const amount = cents(t.amount);
      if (amount <= 0) throw new Error('Transactions must have positive amounts');
      if (t.type === 'EXPENSE' && t.creditCardId) {
        const poolKey = t.categoryId ? key(month,t.categoryId) : null;
        const remaining = poolKey ? (pools.get(poolKey) || 0) : 0;
        const funded = Math.min(amount, Math.max(0,remaining));
        if (poolKey) pools.set(poolKey, remaining - amount);
        const state = t.creditCardId && states.get(t.creditCardId);
        if (state) {
          state.balance += amount; state.reserve += funded;
          if (month===input.month) { state.fromPurchases += funded; state.unfundedPurchases += amount-funded; }
        }
      }
      if (t.type === 'TRANSFER' && t.debtPaymentId) {
        const state = states.get(t.debtPaymentId); if (!state) continue;
        state.balance -= amount; state.reserve -= amount;
        if (month===input.month) state.paid += amount;
      }
    }
  }
  return [...states.values()].map(s=>({
    id:s.id,name:s.name,isClosed:s.isClosed,balance:s.balance/100,assigned:s.assigned/100,
    carried:s.carried/100,fromPurchases:s.fromPurchases/100,paid:s.paid/100,
    available:Math.max(0,s.reserve)/100,shortfall:Math.max(0,-s.reserve)/100,
    unreservedDebt:Math.max(0,s.balance-Math.max(0,s.reserve))/100,
    overReserved:Math.max(0,s.reserve-Math.max(0,s.balance))/100,
    unfundedPurchases:s.unfundedPurchases/100,
  })).filter(s=>!s.isClosed || s.assigned || s.carried || s.fromPurchases || s.paid || s.available || s.shortfall);
}
