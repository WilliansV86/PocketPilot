import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/actions/account-actions';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Testing accounts API endpoint...');
    
    // Test 1: Direct database connection
    let dbTest = { success: false, error: 'Not tested' };
    try {
      const userCount = await prisma.user.count();
      const accountCount = await prisma.financialAccount.count();
      dbTest = { 
        success: true, 
        userCount, 
        accountCount,
        message: 'Database connection works'
      };
    } catch (dbError) {
      dbTest = { 
        success: false, 
        error: dbError instanceof Error ? dbError.message : 'Database error',
        message: 'Database connection failed'
      };
    }
    
    // Test 2: Account action function
    const result = await getAccounts();
    
    console.log('Accounts result:', result);
    
    return NextResponse.json({
      success: true,
      dbTest: dbTest,
      accountsResult: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Accounts API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
