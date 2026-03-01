// Financial color system with consistent meanings and visual clarity

// Color type definition
interface FinancialColorTheme {
  primary: string;
  secondary: string;
  muted: string;
  background: string;
  border: string;
  badge: string;
  progress: string;
  hover: string;
  chart: string;
}

// Base color definitions using CSS variables for dark mode support
export const FINANCIAL_COLORS = {
  // Income colors - green theme
  INCOME: {
    primary: 'text-[var(--financial-income)]',
    secondary: 'text-[var(--financial-income)]/80',
    muted: 'text-[var(--financial-income)]/60',
    background: 'bg-[var(--financial-income-bg)]',
    border: 'border-[var(--financial-income-bg)]',
    badge: 'bg-[var(--financial-income-bg)] text-[var(--financial-income-foreground)] border-[var(--financial-income-bg)]',
    progress: 'bg-[var(--financial-income)]',
    hover: 'hover:bg-[var(--financial-income-bg)] hover:text-[var(--financial-income)]',
    chart: 'hsl(142.5, 80%, 50%)',
  },

  // Expense colors - red theme
  EXPENSE: {
    primary: 'text-[var(--financial-expense)]',
    secondary: 'text-[var(--financial-expense)]/80',
    muted: 'text-[var(--financial-expense)]/60',
    background: 'bg-[var(--financial-expense-bg)]',
    border: 'border-[var(--financial-expense-bg)]',
    badge: 'bg-[var(--financial-expense-bg)] text-[var(--financial-expense-foreground)] border-[var(--financial-expense-bg)]',
    progress: 'bg-[var(--financial-expense)]',
    hover: 'hover:bg-[var(--financial-expense-bg)] hover:text-[var(--financial-expense)]',
    chart: 'hsl(22.5, 80%, 50%)',
  },

  // Savings colors - blue theme
  SAVINGS: {
    primary: 'text-[var(--financial-savings)]',
    secondary: 'text-[var(--financial-savings)]/80',
    muted: 'text-[var(--financial-savings)]/60',
    background: 'bg-[var(--financial-savings-bg)]',
    border: 'border-[var(--financial-savings-bg)]',
    badge: 'bg-[var(--financial-savings-bg)] text-[var(--financial-savings-foreground)] border-[var(--financial-savings-bg)]',
    progress: 'bg-[var(--financial-savings)]',
    hover: 'hover:bg-[var(--financial-savings-bg)] hover:text-[var(--financial-savings)]',
    chart: 'hsl(242.5, 80%, 50%)',
  },

  // Debt colors - orange theme
  DEBT: {
    primary: 'text-[var(--financial-debt)]',
    secondary: 'text-[var(--financial-debt)]/80',
    muted: 'text-[var(--financial-debt)]/60',
    background: 'bg-[var(--financial-debt-bg)]',
    border: 'border-[var(--financial-debt-bg)]',
    badge: 'bg-[var(--financial-debt-bg)] text-[var(--financial-debt-foreground)] border-[var(--financial-debt-bg)]',
    progress: 'bg-[var(--financial-debt)]',
    hover: 'hover:bg-[var(--financial-debt-bg)] hover:text-[var(--financial-debt)]',
    chart: 'hsl(32.5, 80%, 50%)',
  },

  // Neutral colors for totals and balances
  NEUTRAL: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground/70',
    background: 'bg-muted',
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground border-border',
    progress: 'bg-muted-foreground',
    hover: 'hover:bg-muted hover:text-foreground',
    chart: 'hsl(var(--muted-foreground))',
  },

  // Progress indicator colors
  PROGRESS: {
    LOW: 'bg-[var(--financial-savings)]',           // < 50%
    MEDIUM: 'bg-amber-500',       // 50-90%
    HIGH: 'bg-[var(--financial-income)]',         // 100%
    WARNING: 'bg-amber-500',      // Near zero
    DANGER: 'bg-[var(--financial-expense)]',         // Negative
    SUCCESS: 'bg-[var(--financial-income)]',      // Positive available
  },
} as const;

// Progress color utilities
export function getProgressColor(percentage: number): string {
  if (percentage < 50) return FINANCIAL_COLORS.PROGRESS.LOW;
  if (percentage < 90) return FINANCIAL_COLORS.PROGRESS.MEDIUM;
  return FINANCIAL_COLORS.PROGRESS.HIGH;
}

export function getBudgetProgressColor(available: number, budgeted: number): string {
  const percentage = budgeted > 0 ? (available / budgeted) * 100 : 100;
  
  if (available < 0) return FINANCIAL_COLORS.PROGRESS.DANGER;
  if (percentage < 10) return FINANCIAL_COLORS.PROGRESS.WARNING;
  return FINANCIAL_COLORS.PROGRESS.SUCCESS;
}

export function getGoalProgressColor(percentage: number): string {
  if (percentage >= 100) return FINANCIAL_COLORS.PROGRESS.HIGH;
  if (percentage >= 50) return FINANCIAL_COLORS.PROGRESS.MEDIUM;
  return FINANCIAL_COLORS.PROGRESS.LOW;
}

// Financial type color utilities
export function getFinancialTypeColor(type: string): FinancialColorTheme {
  switch (type.toUpperCase()) {
    case 'INCOME':
      return FINANCIAL_COLORS.INCOME;
    case 'EXPENSE':
      return FINANCIAL_COLORS.EXPENSE;
    case 'SAVINGS':
      return FINANCIAL_COLORS.SAVINGS;
    case 'DEBT':
      return FINANCIAL_COLORS.DEBT;
    default:
      return FINANCIAL_COLORS.NEUTRAL;
  }
}

export function getAmountColorClass(amount: number): string {
  if (amount > 0) return FINANCIAL_COLORS.INCOME.primary;
  if (amount < 0) return FINANCIAL_COLORS.EXPENSE.primary;
  return FINANCIAL_COLORS.NEUTRAL.secondary;
}

// Status badge utilities
export function getStatusBadgeVariant(status: string, type: 'debt' | 'goal' | 'category' = 'debt'): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
} {
  switch (type) {
    case 'debt':
      switch (status.toUpperCase()) {
        case 'PAID':
        case 'COMPLETED':
          return { variant: 'default', className: FINANCIAL_COLORS.SAVINGS.badge };
        case 'OVERDUE':
        case 'LATE':
          return { variant: 'destructive', className: FINANCIAL_COLORS.DEBT.badge };
        case 'IN PROGRESS':
        case 'ACTIVE':
          return { variant: 'secondary', className: FINANCIAL_COLORS.NEUTRAL.badge };
        default:
          return { variant: 'outline', className: FINANCIAL_COLORS.NEUTRAL.badge };
      }
      
    case 'goal':
      switch (status.toUpperCase()) {
        case 'COMPLETED':
        case 'ACHIEVED':
          return { variant: 'default', className: FINANCIAL_COLORS.SAVINGS.badge };
        case 'ON TRACK':
        case 'ACTIVE':
          return { variant: 'secondary', className: FINANCIAL_COLORS.NEUTRAL.badge };
        case 'BEHIND':
        case 'AT RISK':
          return { variant: 'destructive', className: FINANCIAL_COLORS.DEBT.badge };
        default:
          return { variant: 'outline', className: FINANCIAL_COLORS.NEUTRAL.badge };
      }
      
    case 'category':
      switch (status.toUpperCase()) {
        case 'ARCHIVED':
          return { variant: 'secondary', className: FINANCIAL_COLORS.NEUTRAL.badge };
        case 'ACTIVE':
          return { variant: 'default', className: FINANCIAL_COLORS.SAVINGS.badge };
        default:
          return { variant: 'outline', className: FINANCIAL_COLORS.NEUTRAL.badge };
      }
      
    default:
      return { variant: 'outline', className: FINANCIAL_COLORS.NEUTRAL.badge };
  }
}

// Animation utilities
export const FINANCIAL_ANIMATIONS = {
  // Balance transitions
  BALANCE_TRANSITION: 'transition-all duration-300 ease-in-out',
  BALANCE_HOVER: 'hover:scale-105 transition-transform duration-200',
  
  // Card animations
  CARD_HOVER: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
  CARD_ELEVATION: 'shadow-sm hover:shadow-md transition-shadow duration-200',
  
  // Progress animations
  PROGRESS_SMOOTH: 'transition-all duration-500 ease-out',
  PROGRESS_BOUNCE: 'transition-all duration-300 ease-bounce',
  
  // Badge animations
  BADGE_PULSE: 'animate-pulse',
  BADGE_BOUNCE: 'animate-bounce',
  
  // Number transitions
  NUMBER_FADE: 'transition-opacity duration-200 ease-in-out',
  NUMBER_SLIDE: 'transition-transform duration-200 ease-in-out',
} as const;

// Chart color palette
export const CHART_COLORS = {
  primary: [
    FINANCIAL_COLORS.INCOME.chart,
    FINANCIAL_COLORS.EXPENSE.chart,
    FINANCIAL_COLORS.SAVINGS.chart,
    FINANCIAL_COLORS.DEBT.chart,
    FINANCIAL_COLORS.NEUTRAL.chart,
  ],
  gradient: {
    income: 'from-green-400 to-green-600',
    expense: 'from-red-400 to-red-600',
    savings: 'from-blue-400 to-blue-600',
    debt: 'from-orange-400 to-orange-600',
  },
} as const;

// Utility functions for consistent styling
export function getFinancialIconColor(type: string): string {
  const colors = getFinancialTypeColor(type);
  return colors.primary;
}

export function getFinancialBackground(type: string): string {
  const colors = getFinancialTypeColor(type);
  return colors.background;
}

export function getFinancialBadge(type: string): string {
  const colors = getFinancialTypeColor(type);
  return colors.badge;
}

// Progress bar utilities
export interface ProgressConfig {
  value: number;
  max: number;
  showPercentage?: boolean;
  animated?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function getProgressConfig(config: ProgressConfig): {
  percentage: number;
  color: string;
  className: string;
} {
  const percentage = Math.min(100, Math.max(0, (config.value / config.max) * 100));
  const color = config.color || getProgressColor(percentage);
  const animation = config.animated ? FINANCIAL_ANIMATIONS.PROGRESS_SMOOTH : '';
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  return {
    percentage,
    color,
    className: `${sizeClasses[config.size || 'md']} ${animation}`,
  };
}
