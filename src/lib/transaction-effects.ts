export type TransactionEffectInput = {
  toAmount?: number | null;
  debtPaymentId?: string | null;
  type: string; amount: number; accountId: string | null; creditCardId?: string | null; toAccountId?: string | null;
};
export function transactionEffects(input: TransactionEffectInput, direction: 1 | -1 = 1) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Amount must be positive");
  if (Boolean(input.accountId) === Boolean(input.creditCardId)) throw new Error("Select one payment source");
  const amount = input.amount * direction;
  if (input.creditCardId) {
    if (input.type !== "EXPENSE" || input.toAccountId) throw new Error("Credit cards can only be selected for purchases");
    return [{ model: "debt" as const, id: input.creditCardId, amount }];
  }
  if (input.debtPaymentId) return [{ model: "account" as const, id: input.accountId!, amount: -amount }, { model: "debt" as const, id: input.debtPaymentId, amount: -amount }];
  if (input.type === "INCOME") return [{ model: "account" as const, id: input.accountId!, amount }];
  if (input.type === "EXPENSE") return [{ model: "account" as const, id: input.accountId!, amount: -amount }];
  if (input.type !== "TRANSFER" || !input.toAccountId || input.toAccountId === input.accountId) throw new Error("Select a different destination account");
  return [{ model: "account" as const, id: input.accountId!, amount: -amount }, { model: "account" as const, id: input.toAccountId, amount: (input.toAmount ?? input.amount) * direction }];
}
