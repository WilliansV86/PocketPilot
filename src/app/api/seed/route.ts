import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('=== PRODUCTION SEEDING START ===');
    
    // Create default user
    const defaultUser = await prisma.user.upsert({
      where: { email: 'dev@pocketpilot.local' },
      update: { name: 'Dev User' },
      create: {
        name: 'Dev User',
        email: 'dev@pocketpilot.local',
      },
    });

    console.log('✅ Default user created:', defaultUser.name);

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
      const category = await prisma.category.upsert({
        where: {
          userId_name: {
            userId: defaultUser.id,
            name: cat.name
          }
        },
        update: {
          group: cat.group as any,
          color: cat.color,
        },
        create: {
          name: cat.name,
          group: cat.group as any,
          color: cat.color,
          userId: defaultUser.id,
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
        userId: defaultUser.id
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
        userId: defaultUser.id
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
        userId: defaultUser.id
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
        userId: defaultUser.id
      },
    });

    console.log('✅ Sample transactions created');

    // Get final counts
    const finalCounts = {
      accounts: await prisma.financialAccount.count(),
      transactions: await prisma.transaction.count(),
      categories: await prisma.category.count(),
      users: await prisma.user.count(),
    };

    console.log('=== PRODUCTION SEEDING COMPLETE ===');
    console.log('Final counts:', finalCounts);

    return NextResponse.json({
      success: true,
      message: 'Production database seeded successfully',
      counts: finalCounts,
      defaultUser: {
        id: defaultUser.id,
        email: defaultUser.email,
        name: defaultUser.name,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Production seeding error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
