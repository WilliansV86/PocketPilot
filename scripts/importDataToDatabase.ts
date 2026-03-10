import { PrismaClient, CategoryGroup, AccountType, TransactionType, DebtType, MoneyOwedStatus, GoalType, GoalPriority } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

interface ExportedData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    userId: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    group: string;
    color: string;
    icon: string;
    isArchived: boolean;
    userId: string;
  }>;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    type: string;
    accountId: string;
    categoryId: string;
    userId: string;
  }>;
  debts: Array<{
    id: string;
    name: string;
    type: string;
    lender: string;
    originalAmount: number | null;
    currentBalance: number;
    interestRateAPR: number | null;
    minimumPayment: number | null;
    dueDayOfMonth: number;
    isClosed: boolean;
    userId: string;
  }>;
  moneyOwed: Array<{
    id: string;
    personName: string;
    description: string;
    amountOriginal: number;
    amountOutstanding: number;
    dueDate: string;
    status: string;
    isArchived: boolean;
    userId: string;
  }>;
  goals: Array<{
    id: string;
    name: string;
    type: string;
    targetAmount: number;
    currentAmount: number;
    startDate: string;
    targetDate: string;
    linkedAccountId: string | null;
    linkedDebtId: string | null;
    autoTrack: boolean;
    priority: string;
    notes: string | null;
    isCompleted: boolean;
    userId: string;
  }>;
}

async function importDataToDatabase() {
  try {
    console.log('📥 Importing data from JSON to database...');
    
    // Read the exported data
    const filePath = './data/exported-data.json';
    const rawData = readFileSync(filePath, 'utf-8');
    const data: ExportedData = JSON.parse(rawData);
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    // 1. Import user
    console.log('\n👤 Importing user...');
    const user = await prisma.user.upsert({
      where: { email: data.user.email },
      update: data.user,
      create: data.user,
    });
    
    if (user) {
      console.log(`✅ User processed: ${data.user.email}`);
      totalInserted++;
    }
    
    // 2. Import categories (needed for transactions)
    console.log('\n📁 Importing categories...');
    for (const category of data.categories) {
      const result = await prisma.category.upsert({
        where: { 
          userId_name: {
            userId: user.id,
            name: category.name
          }
        },
        update: {
          ...category,
          group: category.group as CategoryGroup,
          userId: user.id,
        },
        create: { 
          ...category, 
          group: category.group as CategoryGroup,
          userId: user.id 
        },
      });
      
      if (result) {
        totalInserted++;
      }
    }
    console.log(`✅ Categories: ${data.categories.length} processed`);
    
    // 3. Import accounts
    console.log('\n🏦 Importing accounts...');
    for (const account of data.accounts) {
      const result = await prisma.financialAccount.upsert({
        where: { id: account.id },
        update: {
          ...account,
          type: account.type as AccountType,
          userId: user.id,
        },
        create: { 
          ...account, 
          type: account.type as AccountType,
          userId: user.id 
        },
      });
      
      if (result) {
        totalInserted++;
      }
    }
    console.log(`✅ Accounts: ${data.accounts.length} processed`);
    
    // 4. Import transactions
    console.log('\n💳 Importing transactions...');
    for (const transaction of data.transactions) {
      const result = await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: {
          ...transaction,
          date: new Date(transaction.date),
          type: transaction.type as TransactionType,
          userId: user.id,
        },
        create: {
          ...transaction,
          date: new Date(transaction.date),
          type: transaction.type as TransactionType,
          userId: user.id,
        },
      });
      
      if (result) {
        totalInserted++;
      }
    }
    console.log(`✅ Transactions: ${data.transactions.length} processed`);
    
    // 5. Import debts
    console.log('\n💰 Importing debts...');
    for (const debt of data.debts) {
      const result = await prisma.debt.upsert({
        where: { id: debt.id },
        update: {
          ...debt,
          type: debt.type as DebtType,
          userId: user.id,
        },
        create: { 
          ...debt, 
          type: debt.type as DebtType,
          userId: user.id 
        },
      });
      
      if (result) {
        totalInserted++;
      }
    }
    console.log(`✅ Debts: ${data.debts.length} processed`);
    
    // 6. Import money owed
    console.log('\n🤝 Importing money owed...');
    for (const moneyOwed of data.moneyOwed) {
      const result = await prisma.moneyOwed.upsert({
        where: { id: moneyOwed.id },
        update: {
          ...moneyOwed,
          dueDate: new Date(moneyOwed.dueDate),
          status: moneyOwed.status as MoneyOwedStatus,
          userId: user.id,
        },
        create: {
          ...moneyOwed,
          dueDate: new Date(moneyOwed.dueDate),
          status: moneyOwed.status as MoneyOwedStatus,
          userId: user.id,
        },
      });
      
      if (result) {
        totalInserted++;
      }
    }
    console.log(`✅ Money owed: ${data.moneyOwed.length} processed`);
    
    // 7. Import goals
    console.log('\n🎯 Importing goals...');
    for (const goal of data.goals) {
      const result = await prisma.goal.upsert({
        where: { id: goal.id },
        update: {
          ...goal,
          startDate: new Date(goal.startDate),
          targetDate: new Date(goal.targetDate),
          type: goal.type as GoalType,
          priority: goal.priority as GoalPriority,
          userId: user.id,
        },
        create: {
          ...goal,
          startDate: new Date(goal.startDate),
          targetDate: new Date(goal.targetDate),
          type: goal.type as GoalType,
          priority: goal.priority as GoalPriority,
          userId: user.id,
        },
      });
      
      if (result) {
        totalInserted++;
      }
    }
    console.log(`✅ Goals: ${data.goals.length} processed`);
    
    // 8. Display final counts
    console.log('\n📊 Final database counts:');
    const finalCounts = await prisma.$transaction([
      prisma.user.count(),
      prisma.financialAccount.count(),
      prisma.category.count(),
      prisma.transaction.count(),
      prisma.debt.count(),
      prisma.moneyOwed.count(),
      prisma.goal.count(),
    ]);
    
    const [userCount, accountCount, categoryCount, transactionCount, debtCount, moneyOwedCount, goalCount] = finalCounts;
    
    console.log(`👥 Users imported: ${userCount}`);
    console.log(`🏦 Accounts imported: ${accountCount}`);
    console.log(`📁 Categories imported: ${categoryCount}`);
    console.log(`💳 Transactions imported: ${transactionCount}`);
    console.log(`💰 Debts imported: ${debtCount}`);
    console.log(`🤝 Money owed imported: ${moneyOwedCount}`);
    console.log(`🎯 Goals imported: ${goalCount}`);
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Total records processed: ${totalInserted}`);
    console.log(`⏭️  Safe to run multiple times (uses upsert)`);
    
    return {
      success: true,
      counts: {
        users: userCount,
        accounts: accountCount,
        categories: categoryCount,
        transactions: transactionCount,
        debts: debtCount,
        moneyOwed: moneyOwedCount,
        goals: goalCount,
      }
    };
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importDataToDatabase()
    .then((result) => {
      console.log('\n📋 IMPORT SUMMARY:');
      console.log(`Accounts imported: ${result.counts.accounts}`);
      console.log(`Categories imported: ${result.counts.categories}`);
      console.log(`Transactions imported: ${result.counts.transactions}`);
      console.log(`Debts imported: ${result.counts.debts}`);
      console.log(`Money owed imported: ${result.counts.moneyOwed}`);
      console.log(`Goals imported: ${result.counts.goals}`);
      console.log('✅ Import script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import script failed:', error);
      process.exit(1);
    });
}

export { importDataToDatabase };
