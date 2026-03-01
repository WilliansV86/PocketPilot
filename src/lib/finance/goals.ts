/**
 * Goal Calculation Engine
 * 
 * Shared logic for calculating goal progress, completion status,
 * and automatic tracking based on financial data.
 */

import { formatCurrency } from "@/lib/utils";

export interface GoalProgress {
  goal: any;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  remainingAmount: number;
  isCompleted: boolean;
  status: 'on-track' | 'behind' | 'completed' | 'not-started';
  daysRemaining?: number;
  monthlyProgressNeeded?: number;
}

export interface GoalSummary {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalSaved: number;
  totalTarget: number;
  completionRate: number;
}

/**
 * Normalizes money values to numbers for calculations
 */
export function normalizeMoney(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return 0;
}

/**
 * Calculates the current progress for a goal
 * Handles different goal types and auto-tracking logic
 */
export function calculateGoalProgress(goal: any, linkedData?: { account?: any; debt?: any }): GoalProgress {
  const targetAmount = normalizeMoney(goal.targetAmount);
  let currentAmount = normalizeMoney(goal.currentAmount);

  // Auto-tracking logic based on goal type
  if (goal.autoTrack) {
    switch (goal.type) {
      case 'SAVINGS':
      case 'EMERGENCY_FUND':
      case 'INVESTMENT':
        if (linkedData?.account) {
          currentAmount = normalizeMoney(linkedData.account.balance);
        }
        break;

      case 'DEBT_PAYOFF':
        if (linkedData?.debt) {
          const debtBalance = normalizeMoney(linkedData.debt.currentBalance);
          const originalAmount = normalizeMoney(linkedData.debt.originalAmount) || targetAmount;
          currentAmount = Math.max(0, originalAmount - debtBalance);
        }
        break;

      case 'PURCHASE':
      case 'OTHER':
        // Manual tracking only - use currentAmount from goal
        break;
    }
  }

  const percentage = targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const isCompleted = percentage >= 100 || goal.isCompleted;

  // Calculate status
  let status: 'on-track' | 'behind' | 'completed' | 'not-started' = 'not-started';
  let daysRemaining: number | undefined;
  let monthlyProgressNeeded: number | undefined;

  if (isCompleted) {
    status = 'completed';
  } else if (percentage > 0) {
    if (goal.targetDate) {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      const startDate = new Date(goal.startDate);
      const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalDays > 0 && daysElapsed > 0) {
        const expectedProgress = (daysElapsed / totalDays) * 100;
        status = percentage >= expectedProgress ? 'on-track' : 'behind';
        
        if (daysRemaining > 0) {
          monthlyProgressNeeded = remainingAmount / (daysRemaining / 30); // Rough monthly estimate
        }
      }
    } else {
      status = 'on-track'; // No target date, assume on track
    }
  }

  return {
    goal,
    currentAmount,
    targetAmount,
    percentage,
    remainingAmount,
    isCompleted,
    status,
    daysRemaining,
    monthlyProgressNeeded,
  };
}

/**
 * Gets the percentage completion for a goal
 */
export function getGoalPercentage(goal: any, linkedData?: { account?: any; debt?: any }): number {
  return calculateGoalProgress(goal, linkedData).percentage;
}

/**
 * Checks if a goal is completed
 */
export function isGoalCompleted(goal: any, linkedData?: { account?: any; debt?: any }): boolean {
  return calculateGoalProgress(goal, linkedData).isCompleted;
}

/**
 * Calculates summary statistics for a list of goals
 */
export function calculateGoalSummary(goals: any[], goalProgresses: GoalProgress[]): GoalSummary {
  const totalGoals = goals.length;
  const completedGoals = goalProgresses.filter(p => p.isCompleted).length;
  const activeGoals = totalGoals - completedGoals;
  
  const totalSaved = goalProgresses.reduce((sum, p) => sum + p.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + normalizeMoney(g.targetAmount), 0);
  
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return {
    totalGoals,
    completedGoals,
    activeGoals,
    totalSaved,
    totalTarget,
    completionRate,
  };
}

/**
 * Formats goal progress for display
 */
export function formatGoalProgress(progress: GoalProgress): {
  currentAmount: string;
  targetAmount: string;
  remainingAmount: string;
  percentage: string;
  status: string;
  statusColor: string;
} {
  return {
    currentAmount: formatCurrency(progress.currentAmount),
    targetAmount: formatCurrency(progress.targetAmount),
    remainingAmount: formatCurrency(progress.remainingAmount),
    percentage: `${progress.percentage.toFixed(1)}%`,
    status: progress.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    statusColor: getStatusColor(progress.status),
  };
}

/**
 * Gets the appropriate color for goal status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'on-track':
      return 'text-blue-600';
    case 'behind':
      return 'text-yellow-600';
    case 'not-started':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Gets the appropriate color for progress bar
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Calculates if a goal is behind schedule
 */
export function isGoalBehindSchedule(goal: any, progress: GoalProgress): boolean {
  if (!goal.targetDate || progress.isCompleted) return false;
  
  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const startDate = new Date(goal.startDate);
  
  const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 0 || daysElapsed <= 0) return false;
  
  const expectedProgress = (daysElapsed / totalDays) * 100;
  return progress.percentage < expectedProgress;
}

/**
 * Gets goal priority color
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'HIGH':
      return 'text-red-600 bg-red-50';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50';
    case 'LOW':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Gets goal type icon and description
 */
export function getGoalTypeInfo(type: string): {
  icon: string;
  description: string;
  color: string;
} {
  switch (type) {
    case 'SAVINGS':
      return {
        icon: '💰',
        description: 'Build up savings over time',
        color: 'text-green-600',
      };
    case 'DEBT_PAYOFF':
      return {
        icon: '🏦',
        description: 'Pay off debt completely',
        color: 'text-red-600',
      };
    case 'PURCHASE':
      return {
        icon: '🛍️',
        description: 'Save for a specific purchase',
        color: 'text-blue-600',
      };
    case 'EMERGENCY_FUND':
      return {
        icon: '🆘',
        description: 'Build emergency fund',
        color: 'text-orange-600',
      };
    case 'INVESTMENT':
      return {
        icon: '📈',
        description: 'Investment goal',
        color: 'text-purple-600',
      };
    case 'OTHER':
      return {
        icon: '🎯',
        description: 'Custom financial goal',
        color: 'text-gray-600',
      };
    default:
      return {
        icon: '🎯',
        description: 'Financial goal',
        color: 'text-gray-600',
      };
  }
}

/**
 * Validates goal data
 */
export function validateGoalData(data: {
  name: string;
  type: string;
  targetAmount: number;
  startDate: Date;
  targetDate?: Date;
  linkedAccountId?: string | null;
  linkedDebtId?: string | null;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Goal name is required');
  }

  if (!data.type) {
    errors.push('Goal type is required');
  }

  if (!data.targetAmount || data.targetAmount <= 0) {
    errors.push('Target amount must be greater than 0');
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  }

  if (data.targetDate && data.startDate && data.targetDate <= data.startDate) {
    errors.push('Target date must be after start date');
  }

  if (data.type === 'DEBT_PAYOFF' && !data.linkedDebtId) {
    errors.push('Debt payoff goals must be linked to a debt');
  }

  if (data.type === 'SAVINGS' && data.linkedAccountId && data.linkedDebtId) {
    errors.push('Savings goals can only be linked to an account, not a debt');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
