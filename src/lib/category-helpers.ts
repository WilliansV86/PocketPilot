import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { CategoryGroup } from "@prisma/client";
import { formatCurrency } from "./utils";

// Category group configuration
export const CATEGORY_GROUPS = {
  INCOME: {
    name: "Income",
    description: "Money coming in",
    color: "#10B981",
    icon: "trending-up",
    budgetable: false
  },
  NEEDS: {
    name: "Needs", 
    description: "Essential expenses",
    color: "#EF4444",
    icon: "home",
    budgetable: true
  },
  WANTS: {
    name: "Wants",
    description: "Non-essential expenses", 
    color: "#F59E0B",
    icon: "shopping-bag",
    budgetable: true
  },
  SAVINGS: {
    name: "Savings",
    description: "Money set aside",
    color: "#3B82F6", 
    icon: "piggy-bank",
    budgetable: true
  },
  DEBT: {
    name: "Debt",
    description: "Debt payments",
    color: "#8B5CF6",
    icon: "credit-card",
    budgetable: true
  },
  OTHER: {
    name: "Other",
    description: "Miscellaneous",
    color: "#6B7280",
    icon: "more-horizontal",
    budgetable: true
  }
} as const;

// Icon options for categories
export const CATEGORY_ICONS = [
  "tag", "home", "car", "heart", "briefcase", "laptop", "shopping-cart", "utensils",
  "film", "plane", "palette", "piggy-bank", "credit-card", "graduation-cap", "users",
  "shield", "shield-check", "chart-line", "target", "trending-up", "trending-down",
  "zap", "plus-circle", "minus-circle", "dollar-sign", "wallet", "banknote",
  "building", "factory", "truck", "phone", "gamepad-2", "music", "book",
  "coffee", "pizza", "apple", "gift", "star", "award", "trophy", "flag",
  "bell", "calendar", "clock", "map", "navigation", "camera", "image",
  "file-text", "folder", "archive", "trash-2", "settings", "wrench", "tool"
];

// Color presets for categories
export const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E", "#10B981", "#14B8A6",
  "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF", "#EC4899",
  "#F43F5E", "#64748B", "#475569", "#1E293B"
];

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

// Get month display name
export function getMonthDisplay(month: string): string {
  const date = new Date(`${month}-01`);
  return format(date, "MMMM yyyy");
}

// Format currency with consistent styling
export function formatCurrencyWithSign(amount: number): string {
  return formatCurrency(amount);
}

// Calculate monthly total for a category group
export function calculateGroupMonthlyTotal(
  categories: any[], 
  month: string,
  transactions: any[]
): number {
  const monthStart = startOfMonth(new Date(`${month}-01`));
  const monthEnd = endOfMonth(new Date(`${month}-01`));
  
  return categories.reduce((total, category) => {
    const categoryTransactions = transactions.filter(t => 
      t.categoryId === category.id &&
      t.type === 'EXPENSE' &&
      isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );
    
    return total + categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, 0);
}

// Check if category is budgetable
export function isBudgetable(group: CategoryGroup): boolean {
  return group !== "INCOME";
}

// Get group display info
export function getGroupInfo(group: CategoryGroup) {
  return CATEGORY_GROUPS[group as keyof typeof CATEGORY_GROUPS] || CATEGORY_GROUPS.OTHER;
}

// Sort categories by group and order
export function sortCategories(categories: any[]) {
  const groupOrder = ["INCOME", "NEEDS", "WANTS", "SAVINGS", "DEBT", "OTHER"];
  
  return categories.sort((a, b) => {
    const groupComparison = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
    if (groupComparison !== 0) return groupComparison;
    
    return (a.order || 0) - (b.order || 0);
  });
}

// Generate category dropdown options grouped by group
export function generateCategoryDropdownOptions(categories: any[], includeArchived: boolean = false) {
  const filteredCategories = includeArchived 
    ? categories 
    : categories.filter(cat => !cat.isArchived);
  
  const sortedCategories = sortCategories(filteredCategories);
  
  const grouped = sortedCategories.reduce((acc, category) => {
    if (!acc[category.group]) {
      acc[category.group] = [];
    }
    acc[category.group].push(category);
    return acc;
  }, {} as Record<string, typeof sortedCategories>);
  
  return Object.entries(grouped).map(([group, cats]) => ({
    label: getGroupInfo(group as CategoryGroup).name,
    options: cats.map(cat => ({
      value: cat.id,
      label: cat.name,
      group: cat.group,
      color: cat.color,
      icon: cat.icon,
      isArchived: cat.isArchived
    }))
  }));
}

// Search categories
export function searchCategories(categories: any[], query: string) {
  if (!query.trim()) return categories;
  
  const lowercaseQuery = query.toLowerCase();
  return categories.filter(cat => 
    cat.name.toLowerCase().includes(lowercaseQuery) ||
    cat.group.toLowerCase().includes(lowercaseQuery)
  );
}

// Validate category color
export function validateColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Generate a random color from presets
export function getRandomColor(): string {
  return CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
}

// Get category statistics
export function getCategoryStats(categories: any[], transactions: any[], month?: string) {
  const stats = {
    totalCategories: categories.length,
    activeCategories: categories.filter(cat => !cat.isArchived).length,
    archivedCategories: categories.filter(cat => cat.isArchived).length,
    groupCounts: {} as Record<string, number>,
    monthlyTotals: {} as Record<string, number>
  };

  // Count by group
  categories.forEach(cat => {
    stats.groupCounts[cat.group] = (stats.groupCounts[cat.group] || 0) + 1;
  });

  // Calculate monthly totals if month provided
  if (month) {
    const grouped = generateCategoryDropdownOptions(categories);
    grouped.forEach(group => {
      const groupTotal = calculateGroupMonthlyTotal(
        group.options.map(opt => categories.find(cat => cat.id === opt.value)).filter(Boolean),
        month,
        transactions
      );
      stats.monthlyTotals[group.label] = groupTotal;
    });
  }

  return stats;
}

// Export categories to CSV
export function exportCategoriesToCSV(categories: any[]) {
  const headers = ["Name", "Group", "Color", "Icon", "Archived", "Created"];
  const rows = categories.map(cat => [
    cat.name,
    cat.group,
    cat.color,
    cat.icon,
    cat.isArchived ? "Yes" : "No",
    format(new Date(cat.createdAt), "yyyy-MM-dd")
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return csvContent;
}

// Import categories from CSV
export function parseCategoriesFromCSV(csvContent: string) {
  const lines = csvContent.split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, ""));
  
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.replace(/"/g, ""));
    
    return {
      name: values[0] || "",
      group: values[1] || "OTHER",
      color: values[2] || "#6366F1",
      icon: values[3] || "tag",
      isArchived: values[4] === "Yes"
    };
  }).filter(cat => cat.name.trim());
}

// Debounce function for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
