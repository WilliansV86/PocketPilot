import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== DEBUG: Production Data Initialization ===');
    
    // Get all counts
    const userCount = await prisma.user.count();
    const accountCount = await prisma.financialAccount.count();
    const transactionCount = await prisma.transaction.count();
    const categoryCount = await prisma.category.count();
    
    // Get all users (email only)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
    
    // Check what default user the app is trying to use
    const DEFAULT_USER_EMAIL = "dev@pocketpilot.local";
    const defaultUser = await prisma.user.findUnique({
      where: { email: DEFAULT_USER_EMAIL },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
    
    // Test a sample query using the default user
    let sampleAccounts: any[] = [];
    let sampleTransactions: any[] = [];
    let sampleCategories: any[] = [];
    
    if (defaultUser) {
      sampleAccounts = await prisma.financialAccount.findMany({
        where: { userId: defaultUser.id },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
        },
        take: 3
      });
      
      sampleTransactions = await prisma.transaction.findMany({
        where: { userId: defaultUser.id },
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
        },
        take: 3
      });
      
      sampleCategories = await prisma.category.findMany({
        where: { userId: defaultUser.id },
        select: {
          id: true,
          name: true,
          group: true,
        },
        take: 3
      });
    }
    
    const debugInfo = {
      userCount,
      users,
      accountCount,
      transactionCount,
      categoryCount,
      defaultUserEmail: DEFAULT_USER_EMAIL,
      defaultUser,
      sampleData: {
        accounts: sampleAccounts,
        transactions: sampleTransactions,
        categories: sampleCategories,
      },
      timestamp: new Date().toISOString(),
    };
    
    console.log('=== DEBUG: Data initialization check complete ===');
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('❌ DEBUG: Data initialization error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
