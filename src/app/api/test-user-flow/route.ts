import { NextResponse } from 'next/server';
import { getDefaultUser } from '@/lib/get-default-user';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Testing user and database flow...');
    
    const results: any = {
      success: true,
      message: 'User and database flow test completed',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    // Test 1: Get default user
    console.log('Testing getDefaultUser...');
    try {
      const user = await getDefaultUser();
      results.data.user = {
        success: true,
        id: user.id,
        email: user.email,
        name: user.name
      };
      console.log(`User found: ${user.email} (${user.id})`);
    } catch (error) {
      results.data.userError = error instanceof Error ? error.message : 'Unknown error';
      console.log('User error:', error);
    }
    
    // Test 2: Try to query accounts with that user
    if (results.data.user?.success) {
      console.log('Testing account query...');
      try {
        const accounts = await prisma.financialAccount.findMany({
          where: { userId: results.data.user.id },
          take: 3
        });
        results.data.accounts = {
          success: true,
          count: accounts.length,
          sample: accounts.map(a => ({ name: a.name, balance: Number(a.balance) }))
        };
        console.log(`Accounts found: ${accounts.length}`);
      } catch (error) {
        results.data.accountError = error instanceof Error ? error.message : 'Unknown error';
        console.log('Account query error:', error);
      }
    }
    
    // Test 3: Direct database connection test
    console.log('Testing direct database connection...');
    try {
      const tableCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`;
      results.data.directConnection = {
        success: true,
        tableCount: tableCount[0]?.count || 0
      };
      console.log(`Direct connection: ${tableCount[0]?.count} tables`);
    } catch (error) {
      results.data.directConnectionError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Direct connection error:', error);
    }
    
    console.log('✅ User and database flow test completed');
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ User and database flow test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
