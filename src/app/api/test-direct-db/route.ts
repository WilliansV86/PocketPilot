import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Testing direct database access...');
    
    // Test direct database queries
    const results: any = {
      success: true,
      message: 'Direct database test completed',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    // Test user count
    try {
      const userCount = await prisma.user.count();
      results.data.userCount = userCount;
      console.log(`Users: ${userCount}`);
    } catch (error) {
      results.data.userError = error instanceof Error ? error.message : 'Unknown error';
      console.log('User error:', error);
    }
    
    // Test account count
    try {
      const accountCount = await prisma.financialAccount.count();
      results.data.accountCount = accountCount;
      console.log(`Accounts: ${accountCount}`);
    } catch (error) {
      results.data.accountError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Account error:', error);
    }
    
    // Test category count
    try {
      const categoryCount = await prisma.category.count();
      results.data.categoryCount = categoryCount;
      console.log(`Categories: ${categoryCount}`);
    } catch (error) {
      results.data.categoryError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Category error:', error);
    }
    
    // Test transaction count
    try {
      const transactionCount = await prisma.transaction.count();
      results.data.transactionCount = transactionCount;
      console.log(`Transactions: ${transactionCount}`);
    } catch (error) {
      results.data.transactionError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Transaction error:', error);
    }
    
    // Test debt count
    try {
      const debtCount = await prisma.debt.count();
      results.data.debtCount = debtCount;
      console.log(`Debts: ${debtCount}`);
    } catch (error) {
      results.data.debtError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Debt error:', error);
    }
    
    // Test money owed count
    try {
      const moneyOwedCount = await prisma.moneyOwed.count();
      results.data.moneyOwedCount = moneyOwedCount;
      console.log(`Money Owed: ${moneyOwedCount}`);
    } catch (error) {
      results.data.moneyOwedError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Money Owed error:', error);
    }
    
    // Test goal count
    try {
      const goalCount = await prisma.goal.count();
      results.data.goalCount = goalCount;
      console.log(`Goals: ${goalCount}`);
    } catch (error) {
      results.data.goalError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Goal error:', error);
    }
    
    console.log('✅ Direct database test completed');
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Direct database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
