import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== COMPLETE PRODUCTION DATA SYNC ===');
    
    const body = await request.json();
    const { user: userData, data } = body;
    
    if (!userData || !data) {
      return NextResponse.json({
        success: false,
        error: 'Invalid import data format'
      }, { status: 400 });
    }
    
    // Use Prisma directly
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Database connected');
      
      // Step 1: Ensure user exists
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userData.id || 'user-1',
            name: userData.name || 'PocketPilot User',
            email: userData.email || 'dev@pocketpilot.local',
          },
        });
        console.log('✅ User created:', user.email);
      } else {
        console.log('✅ Using existing user:', user.email);
      }
      
      // Step 2: Clear existing data
      console.log('Clearing existing data...');
      await prisma.transaction.deleteMany({ where: { userId: user.id } });
      await prisma.goal.deleteMany({ where: { userId: user.id } });
      await prisma.moneyOwed.deleteMany({ where: { userId: user.id } });
      await prisma.debt.deleteMany({ where: { userId: user.id } });
      await prisma.category.deleteMany({ where: { userId: user.id } });
      await prisma.financialAccount.deleteMany({ where: { userId: user.id } });
      
      // Step 3: Import categories first
      console.log('Importing categories...');
      const importedCategories = [];
      for (const category of data.categories || []) {
        const importedCategory = await prisma.category.create({
          data: {
            id: category.id,
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
      console.log(`✅ Imported ${importedCategories.length} categories`);
      
      // Step 4: Import accounts
      console.log('Importing accounts...');
      const importedAccounts = [];
      for (const account of data.accounts || []) {
        const importedAccount = await prisma.financialAccount.create({
          data: {
            id: account.id,
            name: account.name,
            type: account.type,
            balance: parseFloat(account.balance) || 0,
            currency: account.currency || 'USD',
            userId: user.id,
          },
        });
        importedAccounts.push(importedAccount);
      }
      console.log(`✅ Imported ${importedAccounts.length} accounts`);
      
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
              id: transaction.id,
              description: transaction.description,
              amount: parseFloat(transaction.amount) || 0,
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
      console.log(`✅ Imported ${importedTransactions.length} transactions`);
      
      // Step 6: Import debts
      console.log('Importing debts...');
      const importedDebts = [];
      for (const debt of data.debts || []) {
        const importedDebt = await prisma.debt.create({
          data: {
            id: debt.id,
            name: debt.name,
            type: debt.type,
            lender: debt.lender,
            originalAmount: parseFloat(debt.originalAmount) || 0,
            currentBalance: parseFloat(debt.currentBalance) || 0,
            interestRateAPR: parseFloat(debt.interestRateAPR) || 0,
            minimumPayment: parseFloat(debt.minimumPayment) || 0,
            dueDayOfMonth: debt.dueDayOfMonth || 1,
            isClosed: debt.isClosed || false,
            userId: user.id,
          },
        });
        importedDebts.push(importedDebt);
      }
      console.log(`✅ Imported ${importedDebts.length} debts`);
      
      // Step 7: Import money owed
      console.log('Importing money owed...');
      const importedMoneyOwed = [];
      for (const moneyOwedItem of data.moneyOwed || []) {
        const importedMoneyOwedItem = await prisma.moneyOwed.create({
          data: {
            id: moneyOwedItem.id,
            personName: moneyOwedItem.personName,
            description: moneyOwedItem.description,
            amountOriginal: parseFloat(moneyOwedItem.amountOriginal) || 0,
            amountOutstanding: parseFloat(moneyOwedItem.amountOutstanding) || 0,
            dueDate: moneyOwedItem.dueDate ? new Date(moneyOwedItem.dueDate) : null,
            status: moneyOwedItem.status || 'OPEN',
            userId: user.id,
          },
        });
        importedMoneyOwed.push(importedMoneyOwedItem);
      }
      console.log(`✅ Imported ${importedMoneyOwed.length} money owed records`);
      
      // Step 8: Import goals
      console.log('Importing goals...');
      const importedGoals = [];
      for (const goal of data.goals || []) {
        const account = importedAccounts.find(a => a.name === goal.linkedAccount?.name);
        
        const importedGoal = await prisma.goal.create({
          data: {
            id: goal.id,
            name: goal.name,
            type: goal.type,
            targetAmount: parseFloat(goal.targetAmount) || 0,
            startDate: goal.startDate ? new Date(goal.startDate) : new Date(),
            targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
            linkedAccountId: account?.id || null,
            autoTrack: goal.autoTrack !== false,
            userId: user.id,
          },
        });
        importedGoals.push(importedGoal);
      }
      console.log(`✅ Imported ${importedGoals.length} goals`);
      
      const finalCounts = {
        accounts: importedAccounts.length,
        transactions: importedTransactions.length,
        categories: importedCategories.length,
        debts: importedDebts.length,
        moneyOwed: importedMoneyOwed.length,
        goals: importedGoals.length,
      };
      
      console.log('✅ COMPLETE SYNC SUCCESS:', finalCounts);
      
      return NextResponse.json({
        success: true,
        message: 'Production data sync completed successfully!',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        counts: finalCounts,
        timestamp: new Date().toISOString(),
      });
      
    } catch (dbError: any) {
      console.error('❌ Database sync error:', dbError);
      
      return NextResponse.json({
        success: false,
        error: 'Database sync failed',
        details: dbError.message,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Complete sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
