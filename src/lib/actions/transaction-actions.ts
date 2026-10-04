"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TransactionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/get-default-user";
import { transactionEffects, type TransactionEffectInput } from "@/lib/transaction-effects";
import { transactionDisplay } from "@/lib/transaction-display";

type Tx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
const transactionSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: z.coerce.number().finite().positive().refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "Use at most two decimal places"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(value => {
    const date = new Date(`${value}T12:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new Error("Invalid date");
    return date;
  }),
  type: z.nativeEnum(TransactionType),
  accountId: z.string().nullable(),
  creditCardId: z.string().nullable(),
  toAccountId: z.string().nullable(),
  categoryId: z.string().nullable(),
  notes: z.string().nullable(),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;
function parseTransaction(formData: FormData) {
  const source = String(formData.get("accountId") || "");
  const card = source.startsWith("card:");
  const type = formData.get("type");
  const parsed = transactionSchema.parse({
    description: formData.get("description"), amount: formData.get("amount"), date: formData.get("date"), type,
    accountId: card ? null : source || null, creditCardId: card ? source.slice(5) || null : null,
    toAccountId: type === "TRANSFER" ? formData.get("toAccountId") || null : null,
    categoryId: formData.get("categoryId") === "__none__" ? null : formData.get("categoryId") || null,
    notes: formData.get("notes") || null,
  });
  transactionEffects(parsed);
  return parsed;
}
async function validateSource(tx: Tx, data: TransactionFormValues, userId: string) {
  if (data.creditCardId) {
    const card = await tx.debt.findFirst({ where: { id: data.creditCardId, userId, type: "CREDIT_CARD", isClosed: false } });
    if (!card) throw new Error("Select an open credit card belonging to your account");
  } else {
    const account = await tx.financialAccount.findFirst({ where: { id: data.accountId!, userId } });
    if (!account) throw new Error("Account not found");
    if (data.type === "TRANSFER") {
      const destination = await tx.financialAccount.findFirst({ where: { id: data.toAccountId!, userId } });
      if (!destination) throw new Error("Destination account not found");
      if (destination.currency !== account.currency) throw new Error("Cross-currency transfers need separate amounts and are not supported yet");
    }
  }
  if (data.categoryId && !await tx.category.findFirst({ where: { id: data.categoryId, userId } })) throw new Error("Category not found");
}
async function applyEffects(tx: Tx, transaction: TransactionEffectInput & { debtPaymentCycle?: string | null }, direction: 1 | -1) {
  if (transaction.debtPaymentId && transaction.debtPaymentCycle) {
    await tx.debt.updateMany({ where: { id: transaction.debtPaymentId, minimumPaymentCycle: transaction.debtPaymentCycle }, data: { minimumPaymentPaid: { increment: transaction.amount * direction } } });
  }
  for (const effect of transactionEffects(transaction, direction)) {
    if (effect.model === "debt") await tx.debt.update({ where: { id: effect.id }, data: { currentBalance: { increment: new Prisma.Decimal(effect.amount) } } });
    else await tx.financialAccount.update({ where: { id: effect.id }, data: { balance: { increment: new Prisma.Decimal(effect.amount) } } });
  }
}
function refreshFinancialPages() {
  for (const page of ["/transactions", "/accounts", "/debts", "/budgets", "/stats", "/goals", "/"]) revalidatePath(page);
}
function actionError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Invalid transaction data";
  // Only validation/concurrency messages are returned; Prisma errors stay on the server.
  const known = ["To correct a Wise transfer, delete it and record the corrected amounts in Recurring Payments.","Manage debt payments from Debts; this entry cannot be edited here.","Invalid date", "Select one payment source", "Credit cards can only be selected for purchases", "Select a different destination account", "Transaction not found", "Transaction changed. Refresh and try again.", "Select an open credit card belonging to your account", "Account not found", "Destination account not found", "Category not found", "Cross-currency transfers need separate amounts and are not supported yet"];
  return error instanceof Error && known.includes(error.message) ? error.message : "Unable to save this transaction. Please try again.";
}
export async function getCreditCardPaymentSources() {
  try {
    const user = await getDefaultUser();
    const cards = await prisma.debt.findMany({ where: { userId: user.id, type: "CREDIT_CARD", isClosed: false }, select: { id: true, name: true, currency: true }, orderBy: [{ currency: "asc" }, { name: "asc" }] });
    return { success: true, data: cards.map(({ id, name, currency }) => ({ id, name, currency })) };
  } catch (error) { console.error("Credit card sources failed", error); return { success: false, data: [], error: "Unable to load credit cards" }; }
}
export async function getTransactions(month?: string) {
  try {
    const user = await getDefaultUser();
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { success: false, error: "Invalid month format. Use YYYY-MM." };
    const [year, monthNumber] = (month || "").split("-").map(Number);
    const rows = await prisma.transaction.findMany({
      where: { userId: user.id, ...(month ? { date: { gte: new Date(Date.UTC(year, monthNumber-1, 1)), lt: new Date(Date.UTC(year, monthNumber, 1)) } } : {}) },
      include: { account: true, creditCard: { select: { id: true, name: true, currency: true } }, category: true, toAccount: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });
    return { success: true, data: rows.map(transactionDisplay) };
  } catch (error) { console.error("Transactions fetch failed", error); return { success: false, error: "Failed to load transactions" }; }
}
export async function getTransactionById(id: string) {
  try {
    const user = await getDefaultUser();
    const row = await prisma.transaction.findUnique({ where: { id, userId: user.id }, include: { account: true, creditCard: { select: { id: true, name: true, currency: true } }, category: true, toAccount: true } });
    if (!row) return { success: false, error: "Transaction not found" };
    return { success: true, data: transactionDisplay(row) };
  } catch (error) { console.error("Transaction fetch failed", error); return { success: false, error: "Failed to load transaction" }; }
}
export async function createTransaction(formData: FormData) {
  try {
    const user = await getDefaultUser(); const data = parseTransaction(formData);
    const row = await prisma.$transaction(async tx => {
      await validateSource(tx, data, user.id);
      const created = await tx.transaction.create({ data: { ...data, userId: user.id } });
      await applyEffects(tx, data, 1);
      return { ...created, amount: Number(created.amount) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refreshFinancialPages(); return { success: true, data: row };
  } catch (error) { console.error("Transaction create failed", error); return { success: false, error: actionError(error) }; }
}
export async function updateTransaction(id: string, formData: FormData) {
  try {
    const user = await getDefaultUser(); const data = parseTransaction(formData);
    const row = await prisma.$transaction(async tx => {
      const original = await tx.transaction.findUnique({ where: { id, userId: user.id } });
      if (!original) throw new Error("Transaction not found");
      if (await tx.moneyOwedPayment.findFirst({ where: { transactionId: id, userId: user.id } })) {
        throw new Error("Edit this received payment from Money Owed > Payment History to keep balances consistent.");
      }
      if (original.toAmount !== null) throw new Error("To correct a Wise transfer, delete it and record the corrected amounts in Recurring Payments.");
      if (original.debtPaymentId) throw new Error("Manage debt payments from Debts; this entry cannot be edited here.");
      await validateSource(tx, data, user.id);
      // Claim the version before moving any balances, preventing stale concurrent edits.
      const updated = await tx.transaction.updateMany({ where: { id, userId: user.id, updatedAt: original.updatedAt }, data });
      if (updated.count !== 1) throw new Error("Transaction changed. Refresh and try again.");
      await applyEffects(tx, { ...original, amount: Number(original.amount), toAmount: original.toAmount === null ? null : Number(original.toAmount) }, -1);
      await applyEffects(tx, data, 1);
      return { id, ...data, amount: Number(data.amount) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refreshFinancialPages(); return { success: true, data: row };
  } catch (error) { console.error("Transaction update failed", error); return { success: false, error: actionError(error) }; }
}
export async function deleteTransaction(id: string) {
  try {
    const user = await getDefaultUser();
    await prisma.$transaction(async tx => {
      const original = await tx.transaction.findUnique({ where: { id, userId: user.id } });
      if (!original) throw new Error("Transaction not found");
      if (await tx.moneyOwedPayment.findFirst({ where: { transactionId: id, userId: user.id } })) {
        throw new Error("Edit this received payment from Money Owed > Payment History to keep balances consistent.");
      }
      const removed = await tx.transaction.deleteMany({ where: { id, userId: user.id, updatedAt: original.updatedAt } });
      if (removed.count !== 1) throw new Error("Transaction changed. Refresh and try again.");
      await applyEffects(tx, { ...original, amount: Number(original.amount), toAmount: original.toAmount === null ? null : Number(original.toAmount) }, -1);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refreshFinancialPages(); return { success: true };
  } catch (error) { console.error("Transaction delete failed", error); return { success: false, error: actionError(error) }; }
}
