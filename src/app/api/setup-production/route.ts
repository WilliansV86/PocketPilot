import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('=== PRODUCTION USER & DATA SETUP START ===');
    
    // Step 1: Ensure default user exists
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No users found, creating default user...');
      user = await prisma.user.create({
        data: {
          name: 'PocketPilot User',
          email: 'dev@pocketpilot.local',
        },
      });
      console.log('Default user created:', user.email);
    } else {
      console.log('Found existing user:', user.email);
    }
    
    // Step 2: Check if user has data
    const accountCount = await prisma.financialAccount.count({
      where: { userId: user.id }
    });
    
    if (accountCount === 0) {
      console.log('No accounts found for user, seeding data...');
      
      // Create default financial accounts
      const checkingAccount = await prisma.financialAccount.create({
        data: {
          id: 'account-checking-1',
          name: 'Main Checking',
          type: 'CHECKING',
          balance: 2500,
          currency: 'USD',
          userId: user.id,
        },
      });

      const savingsAccount = await prisma.financialAccount.create({
        data: {
          id: 'account-savings-1',
          name: 'Savings',
          type: 'SAVINGS',
          balance: 10000,
          currency: 'USD',
          userId: user.id,
        },
      });

      const creditCard = await prisma.financialAccount.create({
        data: {
          id: 'account-credit-1',
          name: 'Credit Card',
          type: 'CREDIT',
          balance: -1500,
          currency: 'USD',
          userId: user.id,
        },
      });

      console.log('✅ Default accounts created');

      // Create essential categories
      const categories = [
        { name: 'Salary', group: 'INCOME', color: '#4CAF50' },
        { name: 'Rent/Mortgage', group: 'NEEDS', color: '#F44336' },
        { name: 'Groceries', group: 'NEEDS', color: '#E91E63' },
        { name: 'Dining Out', group: 'WANTS', color: '#FF9800' },
        { name: 'Entertainment', group: 'WANTS', color: '#FFC107' },
        { name: 'Emergency Fund', group: 'SAVINGS', color: '#2196F3' },
        { name: 'Credit Card Payment', group: 'DEBT', color: '#795548' },
      ];

      const createdCategories = [];
      for (const cat of categories) {
        const category = await prisma.category.create({
          data: {
            name: cat.name,
            group: cat.group as any,
            color: cat.color,
            userId: user.id,
            isArchived: false,
            icon: 'tag',
          },
        });
        createdCategories.push(category);
      }

      console.log('✅ Categories created');

      // Create sample transactions
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const salaryCategory = createdCategories.find(c => c.name === 'Salary');
      const rentCategory = createdCategories.find(c => c.name === 'Rent/Mortgage');
      const groceriesCategory = createdCategories.find(c => c.name === 'Groceries');
      const diningCategory = createdCategories.find(c => c.name === 'Dining Out');

      await prisma.transaction.create({
        data: {
          description: 'Monthly Salary',
          amount: 3500,
          date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
          type: 'INCOME',
          accountId: checkingAccount.id,
          categoryId: salaryCategory!.id,
          userId: user.id
        },
      });

      await prisma.transaction.create({
        data: {
          description: 'Rent Payment',
          amount: -1200,
          date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
          type: 'EXPENSE',
          accountId: checkingAccount.id,
          categoryId: rentCategory!.id,
          userId: user.id
        },
      });

      await prisma.transaction.create({
        data: {
          description: 'Grocery Shopping',
          amount: -150.75,
          date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 8),
          type: 'EXPENSE',
          accountId: checkingAccount.id,
          categoryId: groceriesCategory!.id,
          userId: user.id
        },
      });

      await prisma.transaction.create({
        data: {
          description: 'Restaurant Dinner',
          amount: -85.40,
          date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 15),
          type: 'EXPENSE',
          accountId: creditCard.id,
          categoryId: diningCategory!.id,
          userId: user.id
        },
      });

      console.log('✅ Sample transactions created');
    } else {
      console.log('User already has data, skipping seeding');
    }

    // Get final counts
    const finalCounts = {
      accounts: await prisma.financialAccount.count({ where: { userId: user.id } }),
      transactions: await prisma.transaction.count({ where: { userId: user.id } }),
      categories: await prisma.category.count({ where: { userId: user.id } }),
      users: await prisma.user.count(),
    };

    console.log('=== PRODUCTION USER & DATA SETUP COMPLETE ===');
    console.log('Final counts:', finalCounts);

    return NextResponse.json({
      success: true,
      message: 'Production user and data setup completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      counts: finalCounts,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Production setup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
