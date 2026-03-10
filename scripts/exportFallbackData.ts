import { PrismaClient, CategoryGroup, AccountType, TransactionType, DebtType, MoneyOwedStatus, GoalType, GoalPriority } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

// Fallback data extracted from the UI action files
const fallbackData = {
  accounts: [
    { id: "acc-1", name: "Cash", type: AccountType.CASH, balance: 700, currency: "USD", userId: "user-1" },
    { id: "acc-2", name: "Chase", type: AccountType.CHECKING, balance: 2547.26, currency: "USD", userId: "user-1" },
    { id: "acc-3", name: "Savings", type: AccountType.SAVINGS, balance: 10000, currency: "USD", userId: "user-1" },
    { id: "acc-4", name: "Chase Credit Card", type: AccountType.CREDIT, balance: 0, currency: "USD", userId: "user-1" },
    { id: "acc-5", name: "Wells Fargo", type: AccountType.CHECKING, balance: 0, currency: "USD", userId: "user-1" },
    { id: "acc-6", name: "Wells Fargo Credit Card", type: AccountType.CREDIT, balance: 0, currency: "USD", userId: "user-1" },
    { id: "acc-7", name: "Investment", type: AccountType.INVESTMENT, balance: 5000, currency: "USD", userId: "user-1" },
    { id: "acc-8", name: "Business", type: AccountType.CHECKING, balance: 12000, currency: "USD", userId: "user-1" },
    { id: "acc-9", name: "Emergency", type: AccountType.SAVINGS, balance: 3000, currency: "USD", userId: "user-1" }
  ],
  categories: [
    { id: "cat-1", name: "Salary", group: CategoryGroup.INCOME, color: "#4CAF50", userId: "user-1", isArchived: false, icon: "briefcase" },
    { id: "cat-2", name: "Rent/Mortgage", group: CategoryGroup.NEEDS, color: "#F44336", userId: "user-1", isArchived: false, icon: "home" },
    { id: "cat-3", name: "Groceries", group: CategoryGroup.NEEDS, color: "#E91E63", userId: "user-1", isArchived: false, icon: "shopping-cart" },
    { id: "cat-4", name: "Dining Out", group: CategoryGroup.WANTS, color: "#FF9800", userId: "user-1", isArchived: false, icon: "utensils" },
    { id: "cat-5", name: "Entertainment", group: CategoryGroup.WANTS, color: "#FFC107", userId: "user-1", isArchived: false, icon: "film" },
    { id: "cat-6", name: "Emergency Fund", group: CategoryGroup.SAVINGS, color: "#2196F3", userId: "user-1", isArchived: false, icon: "shield" },
    { id: "cat-7", name: "Credit Card Payment", group: CategoryGroup.DEBT, color: "#795548", userId: "user-1", isArchived: false, icon: "credit-card" },
    { id: "cat-8", name: "Utilities", group: CategoryGroup.NEEDS, color: "#9C27B0", userId: "user-1", isArchived: false, icon: "zap" },
    { id: "cat-9", name: "Gas", group: CategoryGroup.NEEDS, color: "#FF5722", userId: "user-1", isArchived: false, icon: "car" },
    { id: "cat-10", name: "Insurance", group: CategoryGroup.NEEDS, color: "#607D8B", userId: "user-1", isArchived: false, icon: "shield-check" },
    { id: "cat-11", name: "Shopping", group: CategoryGroup.WANTS, color: "#E91E63", userId: "user-1", isArchived: false, icon: "shopping-bag" },
    { id: "cat-12", name: "Subscriptions", group: CategoryGroup.WANTS, color: "#FF9800", userId: "user-1", isArchived: false, icon: "repeat" },
    { id: "cat-13", name: "Healthcare", group: CategoryGroup.NEEDS, color: "#4CAF50", userId: "user-1", isArchived: false, icon: "heart" },
    { id: "cat-14", name: "Fitness", group: CategoryGroup.WANTS, color: "#00BCD4", userId: "user-1", isArchived: false, icon: "dumbbell" },
    { id: "cat-15", name: "Travel", group: CategoryGroup.WANTS, color: "#3F51B5", userId: "user-1", isArchived: false, icon: "plane" },
    { id: "cat-16", name: "Education", group: CategoryGroup.SAVINGS, color: "#009688", userId: "user-1", isArchived: false, icon: "book" },
    { id: "cat-17", name: "Investment", group: CategoryGroup.SAVINGS, color: "#FFC107", userId: "user-1", isArchived: false, icon: "trending-up" },
    { id: "cat-18", name: "Freelance", group: CategoryGroup.INCOME, color: "#8BC34A", userId: "user-1", isArchived: false, icon: "laptop" },
    { id: "cat-19", name: "Bonus", group: CategoryGroup.INCOME, color: "#CDDC39", userId: "user-1", isArchived: false, icon: "gift" },
    { id: "cat-20", name: "Other Income", group: CategoryGroup.INCOME, color: "#FFEB3B", userId: "user-1", isArchived: false, icon: "plus-circle" }
  ],
  transactions: [
    { 
      id: "tx-1", 
      description: "Initial Deposit", 
      amount: 700, 
      date: new Date(), 
      type: TransactionType.INCOME, 
      accountId: "acc-1", 
      categoryId: "cat-1", 
      userId: "user-1"
    },
    { 
      id: "tx-2", 
      description: "Initial Deposit", 
      amount: 2547.26, 
      date: new Date(), 
      type: TransactionType.INCOME, 
      accountId: "acc-2", 
      categoryId: "cat-1", 
      userId: "user-1"
    },
    { 
      id: "tx-3", 
      description: "Initial Deposit", 
      amount: 10000, 
      date: new Date(), 
      type: TransactionType.INCOME, 
      accountId: "acc-3", 
      categoryId: "cat-1", 
      userId: "user-1"
    },
    { 
      id: "tx-4", 
      description: "Grocery Store", 
      amount: 150.75, 
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
      type: TransactionType.EXPENSE, 
      accountId: "acc-2", 
      categoryId: "cat-3", 
      userId: "user-1"
    },
    { 
      id: "tx-5", 
      description: "Restaurant", 
      amount: 85.50, 
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 
      type: TransactionType.EXPENSE, 
      accountId: "acc-2", 
      categoryId: "cat-4", 
      userId: "user-1"
    },
    { 
      id: "tx-6", 
      description: "Gas Station", 
      amount: 65.00, 
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 
      type: TransactionType.EXPENSE, 
      accountId: "acc-2", 
      categoryId: "cat-9", 
      userId: "user-1"
    }
  ],
  debts: [
    {
      id: "debt-1",
      name: "Student Loan",
      type: DebtType.STUDENT_LOAN,
      lender: "Federal Student Aid",
      originalAmount: 25000,
      currentBalance: 18500,
      interestRateAPR: 4.5,
      minimumPayment: 250,
      dueDayOfMonth: 15,
      isClosed: false,
      userId: "user-1"
    },
    {
      id: "debt-2",
      name: "Car Loan",
      type: DebtType.AUTO_LOAN,
      lender: "Chase Auto",
      originalAmount: 15000,
      currentBalance: 8500,
      interestRateAPR: 3.9,
      minimumPayment: 350,
      dueDayOfMonth: 20,
      isClosed: false,
      userId: "user-1"
    }
  ],
  moneyOwed: [
    {
      id: "owed-1",
      personName: "John Doe",
      description: "Lunch money from last week",
      amountOriginal: 50,
      amountOutstanding: 50,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: MoneyOwedStatus.OPEN,
      isArchived: false,
      userId: "user-1"
    },
    {
      id: "owed-2",
      personName: "Jane Smith",
      description: "Movie tickets",
      amountOriginal: 30,
      amountOutstanding: 30,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: MoneyOwedStatus.OPEN,
      isArchived: false,
      userId: "user-1"
    }
  ],
  goals: [
    {
      id: "goal-1",
      name: "Emergency Fund",
      type: GoalType.EMERGENCY_FUND,
      targetAmount: 10000,
      currentAmount: 0,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      linkedAccountId: "acc-3",
      linkedDebtId: null,
      autoTrack: true,
      priority: GoalPriority.HIGH,
      notes: "Build 6 months of expenses",
      isCompleted: false,
      userId: "user-1"
    },
    {
      id: "goal-2",
      name: "Vacation Fund",
      type: GoalType.SAVINGS,
      targetAmount: 3000,
      currentAmount: 0,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      linkedAccountId: "acc-3",
      linkedDebtId: null,
      autoTrack: true,
      priority: GoalPriority.MEDIUM,
      notes: "Summer vacation to Hawaii",
      isCompleted: false,
      userId: "user-1"
    }
  ]
};

async function exportFallbackData() {
  try {
    console.log('📤 Exporting fallback data to JSON...');
    
    // Create exportable data with proper serialization
    const exportData = {
      user: {
        id: "user-1",
        name: "PocketPilot User",
        email: "dev@pocketpilot.local"
      },
      accounts: fallbackData.accounts.map(acc => ({
        ...acc,
        balance: Number(acc.balance)
      })),
      categories: fallbackData.categories,
      transactions: fallbackData.transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        date: tx.date.toISOString()
      })),
      debts: fallbackData.debts.map(debt => ({
        ...debt,
        originalAmount: debt.originalAmount ? Number(debt.originalAmount) : null,
        currentBalance: Number(debt.currentBalance),
        interestRateAPR: debt.interestRateAPR ? Number(debt.interestRateAPR) : null,
        minimumPayment: debt.minimumPayment ? Number(debt.minimumPayment) : null
      })),
      moneyOwed: fallbackData.moneyOwed.map(mo => ({
        ...mo,
        amountOriginal: Number(mo.amountOriginal),
        amountOutstanding: Number(mo.amountOutstanding),
        dueDate: mo.dueDate.toISOString()
      })),
      goals: fallbackData.goals.map(goal => ({
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        startDate: goal.startDate.toISOString(),
        targetDate: goal.targetDate.toISOString()
      }))
    };
    
    // Write to JSON file
    const filePath = './data/exported-data.json';
    writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    console.log('✅ Export completed successfully!');
    console.log(`📁 Data exported to: ${filePath}`);
    console.log(`📊 Summary:`);
    console.log(`   👤 User: 1`);
    console.log(`   🏦 Accounts: ${exportData.accounts.length}`);
    console.log(`   📁 Categories: ${exportData.categories.length}`);
    console.log(`   💳 Transactions: ${exportData.transactions.length}`);
    console.log(`   💰 Debts: ${exportData.debts.length}`);
    console.log(`   🤝 Money Owed: ${exportData.moneyOwed.length}`);
    console.log(`   🎯 Goals: ${exportData.goals.length}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// Run the export
if (require.main === module) {
  exportFallbackData()
    .then(() => {
      console.log('✅ Export script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export script failed:', error);
      process.exit(1);
    });
}

export { exportFallbackData };
