import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== DEBUG: Checking database connection and data ===');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check counts
    const accountCount = await prisma.financialAccount.count();
    const transactionCount = await prisma.transaction.count();
    const categoryCount = await prisma.category.count();
    const userCount = await prisma.user.count();
    
    console.log(`📊 Database counts:`);
    console.log(`  Accounts: ${accountCount}`);
    console.log(`  Transactions: ${transactionCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Users: ${userCount}`);
    
    // Check for default user (common in single-user apps)
    let defaultUser = null;
    if (userCount > 0) {
      defaultUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
        }
      });
      console.log(`👤 Default user:`, defaultUser);
    }
    
    // Check for any data
    const sampleAccount = await prisma.financialAccount.findFirst({
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
      }
    });
    
    const sampleTransaction = await prisma.transaction.findFirst({
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
      }
    });
    
    // Check environment
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT VERCEL',
    };
    
    console.log(`🌍 Environment:`, envInfo);
    
    const debugInfo = {
      success: true,
      connection: 'OK',
      counts: {
        accounts: accountCount,
        transactions: transactionCount,
        categories: categoryCount,
        users: userCount,
      },
      defaultUser,
      sampleData: {
        account: sampleAccount,
        transaction: sampleTransaction,
      },
      environment: envInfo,
      timestamp: new Date().toISOString(),
    };
    
    console.log('=== DEBUG: Database inspection complete ===');
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('❌ DEBUG: Database error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        VERCEL_ENV: process.env.VERCEL_ENV || 'NOT VERCEL',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
