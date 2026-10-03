// Independent starter records; no data is copied from another user.
const starterCategories = [
      // INCOME
      { name: "Salary", group: "INCOME", color: "#10B981", icon: "briefcase" },
      { name: "Freelance", group: "INCOME", color: "#10B981", icon: "laptop" },
      { name: "Investment Income", group: "INCOME", color: "#10B981", icon: "trending-up" },
      { name: "Other Income", group: "INCOME", color: "#10B981", icon: "plus-circle" },
      
      // NEEDS
      { name: "Housing", group: "NEEDS", color: "#EF4444", icon: "home" },
      { name: "Utilities", group: "NEEDS", color: "#EF4444", icon: "zap" },
      { name: "Groceries", group: "NEEDS", color: "#EF4444", icon: "shopping-cart" },
      { name: "Transportation", group: "NEEDS", color: "#EF4444", icon: "car" },
      { name: "Healthcare", group: "NEEDS", color: "#EF4444", icon: "heart" },
      { name: "Insurance", group: "NEEDS", color: "#EF4444", icon: "shield" },
      
      // WANTS
      { name: "Dining Out", group: "WANTS", color: "#F59E0B", icon: "utensils" },
      { name: "Entertainment", group: "WANTS", color: "#F59E0B", icon: "film" },
      { name: "Shopping", group: "WANTS", color: "#F59E0B", icon: "shopping-bag" },
      { name: "Travel", group: "WANTS", color: "#F59E0B", icon: "plane" },
      { name: "Hobbies", group: "WANTS", color: "#F59E0B", icon: "palette" },
      
      // SAVINGS
      { name: "Emergency Fund", group: "SAVINGS", color: "#3B82F6", icon: "shield-check" },
      { name: "Retirement", group: "SAVINGS", color: "#3B82F6", icon: "piggy-bank" },
      { name: "Investments", group: "SAVINGS", color: "#3B82F6", icon: "chart-line" },
      { name: "Savings Goals", group: "SAVINGS", color: "#3B82F6", icon: "target" },
      
      // DEBT
      { name: "Credit Card", group: "DEBT", color: "#8B5CF6", icon: "credit-card" },
      { name: "Student Loans", group: "DEBT", color: "#8B5CF6", icon: "graduation-cap" },
      { name: "Car Loan", group: "DEBT", color: "#8B5CF6", icon: "car" },
      { name: "Personal Loan", group: "DEBT", color: "#8B5CF6", icon: "users" },
] as const;

export function starterCategoryRecords(userId: string) {
  const orders = new Map<string, number>();
  return starterCategories.map(category => {
    const order = (orders.get(category.group) ?? 0) + 1;
    orders.set(category.group, order);
    return { ...category, userId, order };
  });
}
