import { PrismaClient, CategoryGroup, AccountType, TransactionType, DebtType, MoneyOwedStatus, GoalType, GoalPriority } from '@prisma/client';

const prisma = new PrismaClient();

// Fallback data extracted from the UI actions
const fallbackData = {
  user: {
    id: "user-1",
    name: "PocketPilot User",
    email: "dev@pocketpilot.local",
  },
  accounts: [
    { id: "acc-1", name: "Cash", type: AccountType.CASH, balance: 700, currency: "USD", userId: "user-1" },
    { id: "acc-2", name: "Chase", type: AccountType.CHECKING, balance: 2547.26, currency: "USD", userId: "user-1" },
    { id: "acc-3", name: "Savings", type: AccountType.SAVINGS, balance: 10000, currency: "USD", userId: "user-1" },
    { id: "acc-4", name: "Chase Credit Card", type: AccountType.CREDIT, balance: 0, currency: "USD", userId: "user-1" },
    { id: "acc-5", name: "Wells Fargo", type: AccountType.CHECKING, balance: 0, currency: "USD", userId: "user-1" },
    { id: "acc-6", name: "Wells Fargo Credit Card", type: AccountType.CREDIT, balance: 0, currency: "USD", userId: "user-1" }
  ],
  categories: [
    { id: "cat-1", name: "Salary", group: CategoryGroup.INCOME, color: "#4CAF50", userId: "user-1", isArchived: false, icon: "briefcase" },
    { id: "cat-2", name: "Rent/Mortgage", group: CategoryGroup.NEEDS, color: "#F44336", userId: "user-1", isArchived: false, icon: "home" },
    { id: "cat-3", name: "Groceries", group: CategoryGroup.NEEDS, color: "#E91E63", userId: "user-1", isArchived: false, icon: "shopping-cart" },
    { id: "cat-4", name: "Dining Out", group: CategoryGroup.WANTS, color: "#FF9800", userId: "user-1", isArchived: false, icon: "utensils" },
    { id: "cat-5", name: "Entertainment", group: CategoryGroup.WANTS, color: "#FFC107", userId: "user-1", isArchived: false, icon: "film" },
    { id: "cat-6", name: "Emergency Fund", group: CategoryGroup.SAVINGS, color: "#2196F3", userId: "user-1", isArchived: false, icon: "shield" },
    { id: "cat-7", name: "Credit Card Payment", group: CategoryGroup.DEBT, color: "#795548", userId: "user-1", isArchived: false, icon: "credit-card" }
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
    }
  ],
  // Additional sample data for debts, money owed, and goals
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
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
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
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
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
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
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

async function importFallbackData() {
  try {
    console.log('🚀 Starting import of fallback data...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    let totalInserted = 0;
    let totalSkipped = 0;
    
    // 1. Create user if not exists
    console.log('\n📝 Importing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email: fallbackData.user.email }
    });
    
    if (!existingUser) {
      await prisma.user.create({
        data: fallbackData.user
      });
      console.log(`✅ Created user: ${fallbackData.user.email}`);
      totalInserted++;
    } else {
      console.log(`⏭️  User already exists: ${fallbackData.user.email}`);
      totalSkipped++;
    }
    
    // Get user ID for foreign key relationships
    const user = await prisma.user.findUnique({
      where: { email: fallbackData.user.email }
    });
    
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    
    // 2. Import categories (needed for transactions)
    console.log('\n📁 Importing categories...');
    for (const category of fallbackData.categories) {
      const existing = await prisma.category.findFirst({
        where: { 
          userId: user.id,
          name: category.name 
        }
      });
      
      if (!existing) {
        await prisma.category.create({
          data: { ...category, userId: user.id }
        });
        totalInserted++;
      } else {
        totalSkipped++;
      }
    }
    console.log(`✅ Categories: ${fallbackData.categories.length} processed`);
    
    // 3. Import accounts
    console.log('\n🏦 Importing accounts...');
    for (const account of fallbackData.accounts) {
      const existing = await prisma.financialAccount.findFirst({
        where: { 
          userId: user.id,
          name: account.name 
        }
      });
      
      if (!existing) {
        await prisma.financialAccount.create({
          data: { ...account, userId: user.id }
        });
        totalInserted++;
      } else {
        totalSkipped++;
      }
    }
    console.log(`✅ Accounts: ${fallbackData.accounts.length} processed`);
    
    // 4. Import transactions
    console.log('\n💳 Importing transactions...');
    
    // Get the actual account and category IDs from the database
    const dbAccounts = await prisma.financialAccount.findMany({
      where: { userId: user.id },
      select: { id: true, name: true }
    });
    
    const dbCategories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true }
    });
    
    for (const transaction of fallbackData.transactions) {
      const existing = await prisma.transaction.findUnique({
        where: { id: transaction.id }
      });
      
      if (!existing) {
        // Find matching account and category by name
        const account = dbAccounts.find(acc => acc.name === transaction.accountId);
        const category = dbCategories.find(cat => cat.name === transaction.categoryId);
        
        if (account && category) {
          await prisma.transaction.create({
            data: {
              ...transaction,
              accountId: account.id,
              categoryId: category.id,
              userId: user.id
            }
          });
          totalInserted++;
        } else {
          console.log(`⚠️  Skipping transaction - missing account or category: ${transaction.description}`);
          totalSkipped++;
        }
      } else {
        totalSkipped++;
      }
    }
    console.log(`✅ Transactions: ${fallbackData.transactions.length} processed`);
    
    // 5. Import debts (if table exists)
    try {
      console.log('\n💰 Importing debts...');
      for (const debt of fallbackData.debts) {
        const existing = await prisma.debt.findUnique({
          where: { id: debt.id }
        });
        
        if (!existing) {
          await prisma.debt.create({
            data: { ...debt, userId: user.id }
          });
          totalInserted++;
        } else {
          totalSkipped++;
        }
      }
      console.log(`✅ Debts: ${fallbackData.debts.length} processed`);
    } catch (error) {
      console.log('⚠️  Debts table might not exist, skipping...');
    }
    
    // 6. Import money owed (if table exists)
    try {
      console.log('\n🤝 Importing money owed...');
      for (const moneyOwed of fallbackData.moneyOwed) {
        const existing = await prisma.moneyOwed.findUnique({
          where: { id: moneyOwed.id }
        });
        
        if (!existing) {
          await prisma.moneyOwed.create({
            data: { ...moneyOwed, userId: user.id }
          });
          totalInserted++;
        } else {
          totalSkipped++;
        }
      }
      console.log(`✅ Money owed: ${fallbackData.moneyOwed.length} processed`);
    } catch (error) {
      console.log('⚠️  MoneyOwed table might not exist, skipping...');
    }
    
    // 7. Import goals (if table exists)
    try {
      console.log('\n🎯 Importing goals...');
      for (const goal of fallbackData.goals) {
        const existing = await prisma.goal.findUnique({
          where: { id: goal.id }
        });
        
        if (!existing) {
          await prisma.goal.create({
            data: { ...goal, userId: user.id }
          });
          totalInserted++;
        } else {
          totalSkipped++;
        }
      }
      console.log(`✅ Goals: ${fallbackData.goals.length} processed`);
    } catch (error) {
      console.log('⚠️  Goals table might not exist, skipping...');
    }
    
    // 8. Display final counts
    console.log('\n📊 Final database counts:');
    try {
      const userCount = await prisma.user.count();
      const accountCount = await prisma.financialAccount.count();
      const categoryCount = await prisma.category.count();
      const transactionCount = await prisma.transaction.count();
      
      console.log(`👥 Users: ${userCount}`);
      console.log(`🏦 Accounts: ${accountCount}`);
      console.log(`📁 Categories: ${categoryCount}`);
      console.log(`💳 Transactions: ${transactionCount}`);
      
      try {
        const debtCount = await prisma.debt.count();
        console.log(`💰 Debts: ${debtCount}`);
      } catch (e) {
        console.log(`💰 Debts: Table not available`);
      }
      
      try {
        const moneyOwedCount = await prisma.moneyOwed.count();
        console.log(`🤝 Money Owed: ${moneyOwedCount}`);
      } catch (e) {
        console.log(`🤝 Money Owed: Table not available`);
      }
      
      try {
        const goalCount = await prisma.goal.count();
        console.log(`🎯 Goals: ${goalCount}`);
      } catch (e) {
        console.log(`🎯 Goals: Table not available`);
      }
    } catch (error) {
      console.log('❌ Could not get final counts:', error);
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Records inserted: ${totalInserted}`);
    console.log(`⏭️  Records skipped: ${totalSkipped}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importFallbackData()
    .then(() => {
      console.log('✅ Import script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import script failed:', error);
      process.exit(1);
    });
}

export { importFallbackData };
