import test from "node:test";
import assert from "node:assert/strict";
import { authorizeOperation, assertResultOwnership } from "../src/lib/ownership-policy";
import { safeServerAction } from "../src/lib/client-actions";
import { retiredPreviewStorage } from "../src/lib/retired-preview-storage";

const owner = "owner-a";
const lookup = async (_model: string, id: string, userId: string) => id === "owned-record" || id === userId;
const financeModels = ["FinancialAccount", "Transaction", "Category", "Budget", "BudgetMove", "Debt", "MoneyOwed", "MoneyOwedPayment", "Goal", "GoalContribution"];
for (const model of financeModels) {
  test(`${model}: a list/read predicate cannot escape the signed-in owner`, async () => {
    for (const action of ["findMany", "findFirst", "count", "aggregate", "groupBy", "updateMany", "deleteMany"]) {
      const args = await authorizeOperation(model, action, { where: { OR: [{ userId: "owner-b" }, {}] }, ...(action === "updateMany" ? { data: {} } : {}) }, owner, lookup);
      assert.deepEqual(args.where.AND[1], { userId: owner });
      assert.equal(args.where.AND[0].OR[0].userId, "owner-b");
    }
  });
  test(`${model}: edit/delete/ID reads retain the unique ID AND require ownership`, async () => {
    for (const action of ["findUnique", "findUniqueOrThrow", "update", "delete"]) {
      const args = await authorizeOperation(model, action, { where: { id: "victim-id" }, ...(action === "update" ? { data: {} } : {}) }, owner, lookup);
      assert.equal(args.where.id, "victim-id");
      assert.deepEqual(args.where.AND.at(-1), { userId: owner });
    }
  });
  test(`${model}: writes cannot impersonate or change an owner`, async () => {
    for (const action of ["create", "update", "updateMany"]) {
      await assert.rejects(authorizeOperation(model, action, { where: { id: "x" }, data: { userId: "owner-b" } }, owner, lookup), /OWNER_CHANGE_DENIED/);
    }
    const created = await authorizeOperation(model, "create", { data: {} }, owner, lookup);
    assert.equal(created.data.userId, owner);
  });
}
const references: [string, string][] = [
  ["Transaction", "accountId"], ["Transaction", "toAccountId"], ["Transaction", "categoryId"],
  ["Budget", "categoryId"], ["BudgetMove", "fromCategoryId"], ["BudgetMove", "toCategoryId"],
  ["MoneyOwedPayment", "moneyOwedId"], ["MoneyOwedPayment", "accountId"],
  ["Goal", "linkedAccountId"], ["Goal", "linkedDebtId"],
  ["GoalContribution", "goalId"], ["GoalContribution", "accountId"],
];
for (const [model, key] of references) {
  test(`${model}.${key}: cross-user relations are rejected before writing`, async () => {
    await assert.rejects(authorizeOperation(model, "create", { data: { [key]: "victim-record" } }, owner, lookup), /RELATED_RECORD_NOT_FOUND/);
    const good = await authorizeOperation(model, "create", { data: { [key]: "owned-record" } }, owner, lookup);
    assert.equal(good.data[key], "owned-record");
  });
}
test("nested writes, raw queries, unknown models and unsigned access fail closed", async () => {
  await assert.rejects(authorizeOperation("FinancialAccount", "create", { data: { transactions: { create: {} } } }, owner, lookup), /NESTED_WRITE_DENIED/);
  await assert.rejects(authorizeOperation(undefined, "queryRaw", {}, owner, lookup), /UNSCOPED_OPERATION_DENIED/);
  await assert.rejects(authorizeOperation("SecretModel", "findMany", {}, owner, lookup), /UNSCOPED_OPERATION_DENIED/);
  await assert.rejects(authorizeOperation("Debt", "findMany", {}, "", lookup), /AUTHENTICATION_REQUIRED/);
  await assert.rejects(authorizeOperation("User", "delete", { where: { id: owner } }, owner, lookup), /USER_WRITE_DENIED/);
});
test("bulk and upsert writes enforce ownership on both branches", async () => {
  await assert.rejects(authorizeOperation("Category", "createMany", { data: [{ userId: owner }, { userId: "owner-b" }] }, owner, lookup), /OWNER_CHANGE_DENIED/);
  const args = await authorizeOperation("Budget", "upsert", { where: { userId_categoryId_month_currency: { userId: owner, categoryId: "owned-record", month: "2026-10", currency: "CAD" } }, create: { categoryId: "owned-record" }, update: { amount: 20 } }, owner, lookup);
  assert.equal(args.create.userId, owner);
  assert.deepEqual(args.where.AND.at(-1), { userId: owner });
  await assert.rejects(authorizeOperation("Budget", "upsert", { where: { id: "x" }, create: {}, update: { userId: "owner-b" } }, owner, lookup), /OWNER_CHANGE_DENIED/);
});
test("nested reads and relation counts are scoped; nested projections include ownership", async () => {
  const args = await authorizeOperation("MoneyOwed", "findMany", { include: { payments: { select: { amount: true, account: { select: { name: true } } } }, _count: true } }, owner, lookup);
  assert.deepEqual(args.include.payments.where.AND[1], { userId: owner });
  assert.equal(args.include.payments.select.userId, true);
  assert.equal(args.include.payments.select.account.select.userId, true);
  assert.deepEqual(args.include._count.select.payments.where.AND[1], { userId: owner });
  assert.throws(() => assertResultOwnership([{ userId: owner, payments: [{ userId: "owner-b", amount: 1 }] }], owner), /RELATED_OWNER_MISMATCH/);
  assert.doesNotThrow(() => assertResultOwnership([{ userId: owner, payments: [{ userId: owner }] }], owner));
});
test("User reads are restricted to the current database identity", async () => {
  const args = await authorizeOperation("User", "findMany", {}, owner, lookup);
  assert.deepEqual(args.where.AND[1], { id: owner });
});
test("a rejected server write cannot report preview success", async () => {
  let fallbackCalled = false;
  await assert.rejects(safeServerAction(async () => { throw Object.assign(new Error("blocked"), { digest: "3266008295@E80" }); }, async () => { fallbackCalled = true; return { success: true }; }), /blocked/);
  assert.equal(fallbackCalled, false);
});
test("browser-wide financial preview data is never read", () => {
  for (const key of ["newAccounts", "updatedAccounts", "deletedAccounts", "deletedTransactions"]) {
    retiredPreviewStorage.setItem(key, '[{"balance":9999}]');
    assert.equal(retiredPreviewStorage.getItem(key), null);
  }
});
