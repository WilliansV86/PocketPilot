/**
 * Account type color utilities for consistent visual representation
 */

export type AccountType = 
  | "CHECKING"
  | "SAVINGS"
  | "CREDIT_CARD"
  | "INVESTMENT"
  | "CASH"
  | "LOAN"
  | "MORTGAGE"
  | "OTHER";

export interface AccountTypeConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, AccountTypeConfig> = {
  CHECKING: {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "credit-card",
    description: "Daily transactions and payments"
  },
  SAVINGS: {
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: "piggy-bank",
    description: "Emergency fund and savings goals"
  },
  CREDIT_CARD: {
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "credit-card",
    description: "Credit card accounts and balances"
  },
  INVESTMENT: {
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: "trending-up",
    description: "Investment and retirement accounts"
  },
  CASH: {
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: "banknote",
    description: "Physical cash and equivalents"
  },
  LOAN: {
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: "arrow-left-right",
    description: "Personal loans and borrowings"
  },
  MORTGAGE: {
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "home",
    description: "Home mortgage and property loans"
  },
  OTHER: {
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: "more-horizontal",
    description: "Other account types"
  }
};

/**
 * Get color configuration for an account type
 */
export function getAccountTypeConfig(type: string): AccountTypeConfig {
  return ACCOUNT_TYPE_CONFIG[type as AccountType] || ACCOUNT_TYPE_CONFIG.OTHER;
}

/**
 * Get the color class for an account type
 */
export function getAccountTypeColor(type: string): string {
  return getAccountTypeConfig(type).color;
}

/**
 * Get the background color class for an account type
 */
export function getAccountTypeBgColor(type: string): string {
  return getAccountTypeConfig(type).bgColor;
}

/**
 * Get the border color class for an account type
 */
export function getAccountTypeBorderColor(type: string): string {
  return getAccountTypeConfig(type).borderColor;
}

/**
 * Get the icon name for an account type
 */
export function getAccountTypeIcon(type: string): string {
  return getAccountTypeConfig(type).icon;
}

/**
 * Get the description for an account type
 */
export function getAccountTypeDescription(type: string): string {
  return getAccountTypeConfig(type).description;
}

/**
 * Get all available account types
 */
export function getAccountTypes(): AccountType[] {
  return Object.keys(ACCOUNT_TYPE_CONFIG) as AccountType[];
}
