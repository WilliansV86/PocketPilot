import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default user - using email "dev@pocketpilot.local" as requested
  const defaultUser = await prisma.user.upsert({
    where: { email: 'dev@pocketpilot.local' },
    update: {
      name: 'Dev User',
    },
    create: {
      name: 'Dev User',
      email: 'dev@pocketpilot.local',
    },
  });

  console.log('Default user created:', defaultUser.name);

  // Create default financial accounts
  const checkingAccount = await prisma.financialAccount.upsert({
    where: { id: 'account-checking-1' },
    update: {
      name: 'Main Checking',
      type: 'CHECKING',
      balance: 2500,
      currency: 'USD',
      userId: defaultUser.id,
    },
    create: {
      id: 'account-checking-1',
      name: 'Main Checking',
      type: 'CHECKING',
      balance: 2500,
      currency: 'USD',
      userId: defaultUser.id,
    },
  });

  const savingsAccount = await prisma.financialAccount.upsert({
    where: { id: 'account-savings-1' },
    update: {
      name: 'Savings',
      type: 'SAVINGS',
      balance: 10000,
      currency: 'USD',
      userId: defaultUser.id,
    },
    create: {
      id: 'account-savings-1',
      name: 'Savings',
      type: 'SAVINGS',
      balance: 10000,
      currency: 'USD',
      userId: defaultUser.id,
    },
  });

  const creditCard = await prisma.financialAccount.upsert({
    where: { id: 'account-credit-1' },
    update: {
      name: 'Credit Card',
      type: 'CREDIT',
      balance: -1500,
      currency: 'USD',
      userId: defaultUser.id,
    },
    create: {
      id: 'account-credit-1',
      name: 'Credit Card',
      type: 'CREDIT',
      balance: -1500,
      currency: 'USD',
      userId: defaultUser.id,
    },
  });

  console.log('Default accounts created');

  // Create default categories for each category group
  // INCOME categories
  const salaryCategory = await createOrUpdateCategory(defaultUser.id, 'Salary', 'INCOME', '#4CAF50');
  const bonusCategory = await createOrUpdateCategory(defaultUser.id, 'Bonus', 'INCOME', '#8BC34A');
  const investmentsCategory = await createOrUpdateCategory(defaultUser.id, 'Investment Income', 'INCOME', '#009688');
  
  // NEEDS categories
  const rentCategory = await createOrUpdateCategory(defaultUser.id, 'Rent/Mortgage', 'NEEDS', '#F44336');
  const groceriesCategory = await createOrUpdateCategory(defaultUser.id, 'Groceries', 'NEEDS', '#E91E63');
  const utilitiesCategory = await createOrUpdateCategory(defaultUser.id, 'Utilities', 'NEEDS', '#9C27B0');
  const transportationCategory = await createOrUpdateCategory(defaultUser.id, 'Transportation', 'NEEDS', '#673AB7');

  // WANTS categories
  const diningCategory = await createOrUpdateCategory(defaultUser.id, 'Dining Out', 'WANTS', '#FF9800');
  const entertainmentCategory = await createOrUpdateCategory(defaultUser.id, 'Entertainment', 'WANTS', '#FFC107');
  const shoppingCategory = await createOrUpdateCategory(defaultUser.id, 'Shopping', 'WANTS', '#FFEB3B');

  // SAVINGS categories
  const emergencyFundCategory = await createOrUpdateCategory(defaultUser.id, 'Emergency Fund', 'SAVINGS', '#2196F3');
  const retirementCategory = await createOrUpdateCategory(defaultUser.id, 'Retirement', 'SAVINGS', '#03A9F4');
  const investmentSavingsCategory = await createOrUpdateCategory(defaultUser.id, 'Investments', 'SAVINGS', '#00BCD4');

  // DEBT categories
  const creditCardDebtCategory = await createOrUpdateCategory(defaultUser.id, 'Credit Card Payment', 'DEBT', '#795548');
  const studentLoanCategory = await createOrUpdateCategory(defaultUser.id, 'Student Loan', 'DEBT', '#607D8B');
  const carLoanCategory = await createOrUpdateCategory(defaultUser.id, 'Car Loan', 'DEBT', '#9E9E9E');

  console.log('Default categories created');

  // Create sample debts
  const chaseCreditCard = await prisma.debt.upsert({
    where: { id: 'debt-chase-credit-1' },
    update: {
      name: 'Chase Freedom Credit Card',
      type: 'CREDIT_CARD',
      lender: 'Chase Bank',
      originalAmount: 5000,
      currentBalance: 1500,
      interestRateAPR: 18.99,
      minimumPayment: 75,
      dueDayOfMonth: 15,
      userId: defaultUser.id,
    },
    create: {
      id: 'debt-chase-credit-1',
      name: 'Chase Freedom Credit Card',
      type: 'CREDIT_CARD',
      lender: 'Chase Bank',
      originalAmount: 5000,
      currentBalance: 1500,
      interestRateAPR: 18.99,
      minimumPayment: 75,
      dueDayOfMonth: 15,
      userId: defaultUser.id,
    },
  });

  const studentLoan = await prisma.debt.upsert({
    where: { id: 'debt-student-loan-1' },
    update: {
      name: 'Federal Student Loan',
      type: 'STUDENT_LOAN',
      lender: 'Department of Education',
      originalAmount: 25000,
      currentBalance: 18500,
      interestRateAPR: 4.99,
      minimumPayment: 250,
      dueDayOfMonth: 25,
      userId: defaultUser.id,
    },
    create: {
      id: 'debt-student-loan-1',
      name: 'Federal Student Loan',
      type: 'STUDENT_LOAN',
      lender: 'Department of Education',
      originalAmount: 25000,
      currentBalance: 18500,
      interestRateAPR: 4.99,
      minimumPayment: 250,
      dueDayOfMonth: 25,
      userId: defaultUser.id,
    },
  });

  const carLoan = await prisma.debt.upsert({
    where: { id: 'debt-car-loan-1' },
    update: {
      name: 'Car Loan - Honda Civic',
      type: 'AUTO_LOAN',
      lender: 'Toyota Financial',
      originalAmount: 20000,
      currentBalance: 12000,
      interestRateAPR: 6.5,
      minimumPayment: 350,
      dueDayOfMonth: 5,
      userId: defaultUser.id,
    },
    create: {
      id: 'debt-car-loan-1',
      name: 'Car Loan - Honda Civic',
      type: 'AUTO_LOAN',
      lender: 'Toyota Financial',
      originalAmount: 20000,
      currentBalance: 12000,
      interestRateAPR: 6.5,
      minimumPayment: 350,
      dueDayOfMonth: 5,
      userId: defaultUser.id,
    },
  });

  // A closed debt example
  const personalLoan = await prisma.debt.upsert({
    where: { id: 'debt-personal-loan-1' },
    update: {
      name: 'Personal Loan - Bank of America',
      type: 'PERSONAL_LOAN',
      lender: 'Bank of America',
      originalAmount: 3000,
      currentBalance: 0,
      interestRateAPR: 12.5,
      minimumPayment: 100,
      dueDayOfMonth: 10,
      isClosed: true,
      userId: defaultUser.id,
    },
    create: {
      id: 'debt-personal-loan-1',
      name: 'Personal Loan - Bank of America',
      type: 'PERSONAL_LOAN',
      lender: 'Bank of America',
      originalAmount: 3000,
      currentBalance: 0,
      interestRateAPR: 12.5,
      minimumPayment: 100,
      dueDayOfMonth: 10,
      isClosed: true,
      userId: defaultUser.id,
    },
  });

  console.log('Sample debts created');

  // Create sample money owed records
  const clientPayment = await prisma.moneyOwed.upsert({
    where: { id: 'money-owed-client-1' },
    update: {
      personName: 'John Smith',
      description: 'Web design project payment',
      amountOriginal: 1500,
      amountOutstanding: 1500,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      userId: defaultUser.id,
    },
    create: {
      id: 'money-owed-client-1',
      personName: 'John Smith',
      description: 'Web design project payment',
      amountOriginal: 1500,
      amountOutstanding: 1500,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'OPEN',
      userId: defaultUser.id,
    },
  });

  const friendLoan = await prisma.moneyOwed.upsert({
    where: { id: 'money-owed-friend-1' },
    update: {
      personName: 'Sarah Johnson',
      description: 'Personal loan repayment',
      amountOriginal: 500,
      amountOutstanding: 200,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
      status: 'PARTIAL',
      userId: defaultUser.id,
    },
    create: {
      id: 'money-owed-friend-1',
      personName: 'Sarah Johnson',
      description: 'Personal loan repayment',
      amountOriginal: 500,
      amountOutstanding: 200,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
      status: 'PARTIAL',
      userId: defaultUser.id,
    },
  });

  const consultingFee = await prisma.moneyOwed.upsert({
    where: { id: 'money-owed-consulting-1' },
    update: {
      personName: 'ABC Corporation',
      description: 'Marketing consulting services',
      amountOriginal: 3000,
      amountOutstanding: 0,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: 'PAID',
      userId: defaultUser.id,
    },
    create: {
      id: 'money-owed-consulting-1',
      personName: 'ABC Corporation',
      description: 'Marketing consulting services',
      amountOriginal: 3000,
      amountOutstanding: 0,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: 'PAID',
      userId: defaultUser.id,
    },
  });

  console.log('Sample money owed records created');

  // Create sample transactions
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Sample transactions
  await createTransaction({
    description: 'Monthly Salary',
    amount: 3500,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
    type: 'INCOME',
    accountId: checkingAccount.id,
    categoryId: salaryCategory.id,
    userId: defaultUser.id
  });

  await createTransaction({
    description: 'Rent Payment',
    amount: -1200,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
    type: 'EXPENSE',
    accountId: checkingAccount.id,
    categoryId: rentCategory.id,
    userId: defaultUser.id
  });

  await createTransaction({
    description: 'Grocery Shopping',
    amount: -150.75,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 8),
    type: 'EXPENSE',
    accountId: checkingAccount.id,
    categoryId: groceriesCategory.id,
    userId: defaultUser.id
  });

  await createTransaction({
    description: 'Restaurant Dinner',
    amount: -85.40,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 15),
    type: 'EXPENSE',
    accountId: creditCard.id,
    categoryId: diningCategory.id,
    userId: defaultUser.id
  });

  await createTransaction({
    description: 'Movie Night',
    amount: -35.50,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 20),
    type: 'EXPENSE',
    accountId: creditCard.id,
    categoryId: entertainmentCategory.id,
    userId: defaultUser.id
  });

  await createTransaction({
    description: 'Transfer to Savings',
    amount: -500,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 6),
    type: 'TRANSFER',
    accountId: checkingAccount.id,
    categoryId: emergencyFundCategory.id,
    userId: defaultUser.id
  });

  await createTransaction({
    description: 'Transfer from Checking',
    amount: 500,
    date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 6),
    type: 'TRANSFER',
    accountId: savingsAccount.id,
    categoryId: emergencyFundCategory.id,
    userId: defaultUser.id
  });

  console.log('Sample transactions created');
}

// Helper function to create or update a category
async function createOrUpdateCategory(userId: string, name: string, group: string, color: string) {
  const normalizedName = name.trim();
  
  try {
    // Try to find existing category by userId and name (which have a unique constraint)
    const existingCategory = await prisma.category.findUnique({
      where: {
        userId_name: {
          userId: userId,
          name: normalizedName
        }
      }
    });

    if (existingCategory) {
      // Update if it exists
      return await prisma.category.update({
        where: { id: existingCategory.id },
        data: {
          group: group as any,
          color
        }
      });
    } else {
      // Create if it doesn't exist
      return await prisma.category.create({
        data: {
          name: normalizedName,
          group: group as any,
          color,
          userId,
          isArchived: false,
          icon: 'tag' // Default icon
        }
      });
    }
  } catch (error) {
    console.error(`Error creating/updating category ${name}:`, error);
    throw error;
  }
}

// Helper function for creating transactions
async function createTransaction(data: {
  description: string;
  amount: number;
  date: Date;
  type: string;
  accountId: string;
  categoryId: string;
  userId: string;
}) {
  try {
    return await prisma.transaction.create({
      data: {
        ...data,
        type: data.type as any
      }
    });
  } catch (error) {
    console.error(`Error creating transaction: ${data.description}`, error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
