import test from "node:test";
import assert from "node:assert/strict";
import { transactionEffects } from "../src/lib/transaction-effects";
import { currentTransactionMonth, resolveTransactionMonth } from "../src/lib/transaction-month";
import { transactionDisplay } from "../src/lib/transaction-display";
import { authorizeOperation } from "../src/lib/ownership-policy";

test("Alberta month at UTC month rollover and explicit all/history", () => {
  const at = new Date("2026-11-01T02:00:00Z");
  assert.equal(currentTransactionMonth(at), "2026-10");
  assert.equal(resolveTransactionMonth(null, at), "2026-10");
  assert.equal(resolveTransactionMonth("2026-09", at), "2026-09");
  assert.equal(resolveTransactionMonth("all", at), undefined);
});
test("card purchase increases debt only; reversal cancels exactly", () => {
  const card = { type: "EXPENSE", amount: 29.76, accountId: null, creditCardId: "card-a" };
  assert.deepEqual(transactionEffects(card), [{ model: "debt", id: "card-a", amount: 29.76 }]);
  assert.equal(transactionEffects(card)[0].amount + transactionEffects(card, -1)[0].amount, 0);
});
test("editing a card purchase reverses its old amount before new amount", () => {
  const old = { type: "EXPENSE", amount: 10, accountId: null, creditCardId: "card-a" };
  const next = { ...old, amount: 15 };
  assert.equal([...transactionEffects(old, -1), ...transactionEffects(next)].reduce((n,e) => n + e.amount, 0), 5);
});
test("changing payment source restores bank cash and adds card debt", () => {
  const old = { type: "EXPENSE", amount: 10, accountId: "bank-a" };
  const next = { ...old, accountId: null, creditCardId: "card-a" };
  assert.deepEqual([...transactionEffects(old, -1), ...transactionEffects(next)], [
    { model: "account", id: "bank-a", amount: 10 }, { model: "debt", id: "card-a", amount: 10 },
  ]);
});
test("bank income, expense and same-currency transfer effects remain unchanged", () => {
  const bank = { type: "INCOME", amount: 20, accountId: "bank-a" };
  assert.equal(transactionEffects(bank)[0].amount, 20);
  assert.equal(transactionEffects({ ...bank, type: "EXPENSE" })[0].amount, -20);
  assert.deepEqual(transactionEffects({ ...bank, type: "TRANSFER", toAccountId: "bank-b" }).map(e => e.amount), [-20,20]);
});
test("ambiguous source, card income/transfers, self transfers and invalid amounts are rejected", () => {
  for (const input of [
    { type: "EXPENSE", amount: 10, accountId: null },
    { type: "EXPENSE", amount: 10, accountId: "bank", creditCardId: "card" },
    { type: "INCOME", amount: 10, accountId: null, creditCardId: "card" },
    { type: "TRANSFER", amount: 10, accountId: null, creditCardId: "card", toAccountId: "bank" },
    { type: "TRANSFER", amount: 10, accountId: "bank", toAccountId: "bank" },
    { type: "EXPENSE", amount: NaN, accountId: "bank" },
    { type: "EXPENSE", amount: -1, accountId: "bank" },
  ]) assert.throws(() => transactionEffects(input));
});
test("card display uses its currency and does not expose Decimal card data", () => {
  const row = transactionDisplay({ amount: "12.50", account: null, creditCardId: "c", creditCard: { id: "c", name: "TD Visa", currency: "CAD", currentBalance: "70" } });
  assert.equal(row.account.currency, "CAD");
  assert.equal(row.account.name, "TD Visa · Credit card");
  assert.equal(row.amount, 12.5);
  assert.equal(row.creditCard, undefined);
});
test("ownership policy denies selecting another user's card", async () => {
  await assert.rejects(authorizeOperation("Transaction", "create", { data: { amount: 10, accountId: null, creditCardId: "other-card" } }, "owner", async(model) => model !== "Debt"), /RELATED_RECORD_NOT_FOUND/);
});
test("ownership policy validates own card and scopes transaction reads", async () => {
  let checked = false;
  const result = await authorizeOperation("Transaction", "create", { data: { amount: 10, accountId: null, creditCardId: "my-card" } }, "owner", async(model,id,user) => { checked = model === "Debt" && id === "my-card" && user === "owner"; return checked; });
  assert.equal(checked, true); assert.equal(result.data.userId, "owner");
  const read = await authorizeOperation("Transaction", "findMany", { where: { OR: [{ account: { currency: "CAD" } }, { creditCard: { currency: "CAD" } }] } }, "owner", async() => true);
  assert.deepEqual(read.where.AND[1], { userId: "owner" });
});
test("card repayments reduce cash and debt, and reversing restores both", () => {
  const payment = { type: "TRANSFER", amount: 50, accountId: "bank", debtPaymentId: "card" };
  assert.deepEqual(transactionEffects(payment), [{model:"account",id:"bank",amount:-50},{model:"debt",id:"card",amount:-50}]);
  assert.deepEqual(transactionEffects(payment, -1), [{model:"account",id:"bank",amount:50},{model:"debt",id:"card",amount:50}]);
});
