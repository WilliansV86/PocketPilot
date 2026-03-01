// Centralized formatting utilities for consistent UI across the application

// Currency formatter with consistent formatting
export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Format currency with consistent styling
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$0.00';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '$0.00';
  }
  
  return currencyFormatter.format(numAmount);
}

// Format currency without currency symbol (for compact display)
export function formatCurrencyCompact(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '0.00';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }
  
  const absAmount = Math.abs(numAmount);
  
  if (absAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return numAmount.toFixed(2);
  }
}

// Format percentage with consistent styling
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0%';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return `${numValue.toFixed(1)}%`;
}

// Format date with consistent styling
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return 'No date';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'No date';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format month (YYYY-MM) for display
export function formatMonth(month: string): string {
  if (!month || !month.includes('-')) {
    return month;
  }
  
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

// Format relative time (e.g., "2 days ago")
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Unknown time';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

// Format number with thousands separator
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(numValue);
}

// Get CSS class for text color based on value (positive/negative)
export function getAmountColorClass(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'text-muted-foreground';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount > 0) {
    return 'text-green-600';
  } else if (numAmount < 0) {
    return 'text-red-600';
  } else {
    return 'text-muted-foreground';
  }
}

// Get appropriate icon for transaction type
export function getTransactionIcon(type: string): string {
  switch (type.toUpperCase()) {
    case 'INCOME':
      return 'trending-up';
    case 'EXPENSE':
      return 'trending-down';
    case 'TRANSFER':
      return 'arrow-right-left';
    default:
      return 'circle';
  }
}

// Get appropriate color for transaction type
export function getTransactionColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'INCOME':
      return 'text-green-600';
    case 'EXPENSE':
      return 'text-red-600';
    case 'TRANSFER':
      return 'text-blue-600';
    default:
      return 'text-muted-foreground';
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
}

// Capitalize first letter of each word
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Convert snake_case or kebab-case to Title Case
export function toTitleCase(text: string): string {
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Get status badge variant
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'OPEN':
    case 'PAID':
      return 'default';
    case 'INACTIVE':
    case 'CLOSED':
    case 'ARCHIVED':
      return 'secondary';
    case 'OVERDUE':
    case 'LATE':
    case 'ERROR':
      return 'destructive';
    default:
      return 'outline';
  }
}

// Get status color class
export function getStatusColorClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'OPEN':
    case 'PAID':
      return 'text-green-600 bg-green-50';
    case 'INACTIVE':
    case 'CLOSED':
    case 'ARCHIVED':
      return 'text-gray-600 bg-gray-50';
    case 'OVERDUE':
    case 'LATE':
    case 'ERROR':
      return 'text-red-600 bg-red-50';
    case 'PENDING':
    case 'PROCESSING':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-blue-600 bg-blue-50';
  }
}
