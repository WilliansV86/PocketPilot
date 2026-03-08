import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    console.log('=== IMPORTING LOCAL DATA TO PRODUCTION ===');
    
    const body = await request.json();
    const { user: userData, data } = body;
    
    if (!userData || !data) {
      return NextResponse.json({
        success: false,
        error: 'Invalid import data format'
      }, { status: 400 });
    }
    
    // Step 1: Ensure user exists in production
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('Creating user in production...');
      user = await prisma.user.create({
        data: {
          name: userData.name || 'PocketPilot User',
          email: userData.email || 'dev@pocketpilot.local',
        },
      });
    } else {
      console.log('Using existing user:', user.email);
    }
    
    console.log('User ID:', user.id);
    
    // Step 2: Clear existing sample data (optional - comment out if you want to keep it)
    console.log('Clearing existing data...');
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.goal.deleteMany({ where: { userId: user.id } });
    await prisma.moneyOwed.deleteMany({ where: { userId: user.id } });
    await prisma.debt.deleteMany({ where: { userId: user.id } });
    await prisma.category.deleteMany({ where: { userId: user.id } });
    await prisma.financialAccount.deleteMany({ where: { userId: user.id } });
    
    // Step 3: Import categories first (needed for transactions)
    console.log('Importing categories...');
    const importedCategories = [];
    for (const category of data.categories || []) {
      const importedCategory = await prisma.category.create({
        data: {
          name: category.name,
          group: category.group,
          color: category.color,
          userId: user.id,
          isArchived: category.isArchived || false,
          icon: category.icon || 'tag',
        },
      });
      importedCategories.push(importedCategory);
    }
    
    // Step 4: Import accounts
    console.log('Importing accounts...');
    const importedAccounts = [];
    for (const account of data.accounts || []) {
      const importedAccount = await prisma.financialAccount.create({
        data: {
          name: account.name,
          type: account.type,
          balance: account.balance,
          currency: account.currency || 'USD',
          userId: user.id,
        },
      });
      importedAccounts.push(importedAccount);
    }
    
    // Step 5: Import transactions
    console.log('Importing transactions...');
    const importedTransactions = [];
    for (const transaction of data.transactions || []) {
      // Find matching account and category
      const account = importedAccounts.find(a => a.name === transaction.account?.name);
      const category = importedCategories.find(c => c.name === transaction.category?.name);
      
      if (account && category) {
        const importedTransaction = await prisma.transaction.create({
          data: {
            description: transaction.description,
            amount: transaction.amount,
            date: new Date(transaction.date),
            type: transaction.type,
            accountId: account.id,
            categoryId: category.id,
            userId: user.id,
          },
        });
        importedTransactions.push(importedTransaction);
      }
    }
    
    // Step 6: Import debts
    console.log('Importing debts...');
    const importedDebts = [];
    for (const debt of data.debts || []) {
      const importedDebt = await prisma.debt.create({
        data: {
          name: debt.name,
          type: debt.type,
          lender: debt.lender,
          originalAmount: debt.originalAmount,
          currentBalance: debt.currentBalance,
          interestRateAPR: debt.interestRateAPR,
          minimumPayment: debt.minimumPayment,
          dueDayOfMonth: debt.dueDayOfMonth,
          isClosed: debt.isClosed || false,
          userId: user.id,
        },
      });
      importedDebts.push(importedDebt);
    }
    
    // Step 7: Import money owed
    console.log('Importing money owed...');
    const importedMoneyOwed = [];
    for (const moneyOwedItem of data.moneyOwed || []) {
      const importedMoneyOwedItem = await prisma.moneyOwed.create({
        data: {
          personName: moneyOwedItem.personName,
          description: moneyOwedItem.description,
          amountOriginal: moneyOwedItem.amountOriginal,
          amountOutstanding: moneyOwedItem.amountOutstanding,
          dueDate: moneyOwedItem.dueDate ? new Date(moneyOwedItem.dueDate) : null,
          status: moneyOwedItem.status || 'OPEN',
          userId: user.id,
        },
      });
      importedMoneyOwed.push(importedMoneyOwedItem);
    }
    
    // Step 8: Import goals
    console.log('Importing goals...');
    const importedGoals = [];
    for (const goal of data.goals || []) {
      const account = importedAccounts.find(a => a.name === goal.linkedAccount?.name);
      
      const importedGoal = await prisma.goal.create({
        data: {
          name: goal.name,
          type: goal.type,
          targetAmount: goal.targetAmount,
          startDate: goal.startDate ? new Date(goal.startDate) : new Date(),
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
          linkedAccountId: account?.id || null,
          linkedDebtId: null, // You can add debt mapping if needed
          autoTrack: goal.autoTrack !== false,
          userId: user.id,
        },
      });
      importedGoals.push(importedGoal);
    }
    
    const finalCounts = {
      accounts: importedAccounts.length,
      transactions: importedTransactions.length,
      categories: importedCategories.length,
      debts: importedDebts.length,
      moneyOwed: importedMoneyOwed.length,
      goals: importedGoals.length,
    };
    
    console.log('=== IMPORT COMPLETE ===');
    console.log('Final counts:', finalCounts);
    
    return NextResponse.json({
      success: true,
      message: 'Local data successfully imported to production',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      counts: finalCounts,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
