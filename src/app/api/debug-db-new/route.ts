import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== DEBUG: Database counts ===');
    
    // Get counts for all major entities
    const userCount = await prisma.user.count();
    const accountCount = await prisma.financialAccount.count();
    const transactionCount = await prisma.transaction.count();
    const categoryCount = await prisma.category.count();
    const goalCount = await prisma.goal.count();
    const budgetCount = await prisma.budget.count();
    const debtCount = await prisma.debt.count();
    const moneyOwedCount = await prisma.moneyOwed.count();
    
    // Get sample data to verify it's real
    const sampleUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      take: 5
    });
    
    const sampleAccounts = await prisma.financialAccount.findMany({
      select: { id: true, name: true, type: true, balance: true },
      take: 5
    });
    
    const sampleTransactions = await prisma.transaction.findMany({
      select: { id: true, description: true, amount: true, date: true },
      take: 5,
      orderBy: { date: 'desc' }
    });
    
    const sampleCategories = await prisma.category.findMany({
      select: { id: true, name: true, group: true, color: true },
      take: 5
    });
    
    const debugInfo = {
      database: {
        userCount,
        accountCount,
        transactionCount,
        categoryCount,
        goalCount,
        budgetCount,
        debtCount,
        moneyOwedCount
      },
      sampleData: {
        users: sampleUsers,
        accounts: sampleAccounts,
        transactions: sampleTransactions,
        categories: sampleCategories
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };
    
    console.log('=== DEBUG: Data counts ===', debugInfo.database);
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('❌ DEBUG: Database error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
