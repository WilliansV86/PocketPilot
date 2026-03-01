/**
 * Net Worth Engine - Centralized calculation module for net worth and asset/liability breakdowns
 * 
 * This module provides consistent calculations across the entire application.
 * All net worth calculations should use these functions to ensure consistency.
 */

// Account types that are considered assets
const ASSET_ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'OTHER'] as const;

// Account types that are considered liabilities  
const LIABILITY_ACCOUNT_TYPES = ['CREDIT', 'LOAN'] as const;

/**
 * Normalizes money values to a consistent number format
 * Handles Decimal, number, and string inputs
 */
export function normalizeMoney(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Handle Decimal objects (from Prisma)
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  
  return 0;
}

/**
 * Calculates total assets from financial accounts
 * Only counts asset account types (CHECKING, SAVINGS, CASH, INVESTMENT, OTHER)
 * Uses positive balances only
 */
export function getAccountAssetTotal(accounts: any[]): number {
  return accounts
    .filter(account => ASSET_ACCOUNT_TYPES.includes(account.type))
    .reduce((total, account) => {
      const balance = normalizeMoney(account.balance);
      return total + Math.max(0, balance); // Only positive balances count as assets
    }, 0);
}

/**
 * Calculates total liabilities from financial accounts
 * Only counts liability account types (CREDIT, LOAN)
 * Uses absolute value of balances
 */
export function getAccountLiabilityTotal(accounts: any[]): number {
  return accounts
    .filter(account => LIABILITY_ACCOUNT_TYPES.includes(account.type))
    .reduce((total, account) => {
      const balance = normalizeMoney(account.balance);
      return total + Math.abs(balance); // Use absolute value for liabilities
    }, 0);
}

/**
 * Calculates total receivables (money owed to user)
 * Only counts outstanding amounts where status is not PAID and not archived
 */
export function getReceivablesTotal(moneyOwed: any[]): number {
  return moneyOwed
    .filter(item => 
      item.status !== 'PAID' && 
      !item.isArchived
    )
    .reduce((total, item) => {
      return total + normalizeMoney(item.amountOutstanding);
    }, 0);
}

/**
 * Calculates total debts (money user owes)
 * Only counts debts that are not closed
 */
export function getDebtsTotal(debts: any[]): number {
  return debts
    .filter(debt => !debt.isClosed)
    .reduce((total, debt) => {
      return total + normalizeMoney(debt.currentBalance);
    }, 0);
}

/**
 * Complete net worth breakdown calculation
 * Returns detailed breakdown of assets, liabilities, and net worth
 */
export function getNetWorthBreakdown(data: {
  accounts: any[];
  debts: any[];
  moneyOwed: any[];
}): {
  assets: {
    accountAssets: number;
    receivables: number;
    total: number;
  };
  liabilities: {
    debts: number;
    accountLiabilities: number;
    total: number;
  };
  netWorth: number;
} {
  const { accounts, debts, moneyOwed } = data;
  
  // Calculate assets
  const accountAssets = getAccountAssetTotal(accounts);
  const receivables = getReceivablesTotal(moneyOwed);
  const totalAssets = accountAssets + receivables;
  
  // Calculate liabilities
  const debtLiabilities = getDebtsTotal(debts);
  const accountLiabilities = getAccountLiabilityTotal(accounts);
  const totalLiabilities = debtLiabilities + accountLiabilities;
  
  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities;
  
  return {
    assets: {
      accountAssets,
      receivables,
      total: totalAssets,
    },
    liabilities: {
      debts: debtLiabilities,
      accountLiabilities,
      total: totalLiabilities,
    },
    netWorth,
  };
}

/**
 * Formats net worth values for display with proper currency formatting
 */
export function formatNetWorthValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Determines if net worth is positive, negative, or neutral for UI styling
 */
export function getNetWorthStatus(netWorth: number): 'positive' | 'negative' | 'neutral' {
  if (netWorth > 0.01) return 'positive';
  if (netWorth < -0.01) return 'negative';
  return 'neutral';
}

/**
 * Calculates net worth change over time (for future use with historical data)
 */
export function calculateNetWorthChange(current: number, previous: number): {
  amount: number;
  percentage: number;
  isIncrease: boolean;
} {
  const amount = current - previous;
  const percentage = previous !== 0 ? (amount / Math.abs(previous)) * 100 : 0;
  const isIncrease = amount > 0;
  
  return {
    amount,
    percentage,
    isIncrease,
  };
}
