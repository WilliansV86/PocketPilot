// Client-safe presentation: a card is a payment source, never a duplicate bank account.
export function transactionDisplay(transaction: any) {
  const { creditCard, ...rest } = transaction;
  return {
    ...rest,
    amount: Number(transaction.amount),
    toAmount: transaction.toAmount == null ? null : Number(transaction.toAmount),
    category: transaction.category ?? (transaction.type === "TRANSFER"
      ? { id: null, name: transaction.debtPaymentId ? "Credit card payment" : "Transfer", type: "TRANSFER", color: null, icon: null }
      : null),
    account: transaction.account ? { ...transaction.account, balance: Number(transaction.account.balance ?? 0) }
      : creditCard ? { id: creditCard.id, name: `${creditCard.name} · Credit card`, currency: creditCard.currency, type: "CREDIT", balance: -Number(creditCard.currentBalance ?? 0) } : null,
    toAccount: transaction.toAccount ? { ...transaction.toAccount, balance: Number(transaction.toAccount.balance ?? 0) } : null,
  };
}
