import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== EXPORTING LOCAL DATA FOR PRODUCTION SYNC ===');
    
    // Get the default user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No user found in local database'
      }, { status: 400 });
    }
    
    // Export all data for this user
    const accounts = await prisma.financialAccount.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 100 // Limit to last 100 transactions
    });
    
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    const moneyOwed = await prisma.moneyOwed.findMany({
      where: { userId: user.id },
      orderBy: { personName: 'asc' }
    });
    
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    const exportData = {
      user: {
        email: user.email,
        name: user.name
      },
      data: {
        accounts,
        transactions,
        categories,
        debts,
        moneyOwed,
        goals
      },
      counts: {
        accounts: accounts.length,
        transactions: transactions.length,
        categories: categories.length,
        debts: debts.length,
        moneyOwed: moneyOwed.length,
        goals: goals.length
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('=== EXPORT COMPLETE ===');
    console.log(`Exported ${exportData.counts.accounts} accounts, ${exportData.counts.transactions} transactions, ${exportData.counts.categories} categories`);
    
    return NextResponse.json(exportData);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
