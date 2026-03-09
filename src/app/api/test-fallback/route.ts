import { NextResponse } from 'next/server';
import { getDefaultUser } from '@/lib/get-default-user';
import { getAccounts } from '@/lib/actions/account-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { getTransactions } from '@/lib/actions/transaction-actions';

export async function GET() {
  try {
    console.log('=== TESTING FALLBACK DATA ===');
    
    // Test user
    const user = await getDefaultUser();
    console.log('User:', user.email);
    
    // Test accounts
    const accountsResult = await getAccounts();
    console.log('Accounts:', accountsResult.success ? accountsResult.data.length : 'Failed');
    
    // Test categories
    const categoriesResult = await getCategories();
    console.log('Categories:', categoriesResult.success ? categoriesResult.data.length : 'Failed');
    
    // Test transactions
    const transactionsResult = await getTransactions();
    console.log('Transactions:', transactionsResult.success ? transactionsResult.data?.length || 0 : 'Failed');
    
    const testData = {
      success: true,
      message: 'Fallback data test completed',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      data: {
        accounts: accountsResult.success ? {
          count: accountsResult.data.length,
          sample: accountsResult.data.slice(0, 2)
        } : { error: 'Failed to load accounts' },
        categories: categoriesResult.success ? {
          count: categoriesResult.data.length,
          sample: categoriesResult.data.slice(0, 2)
        } : { error: 'Failed to load categories' },
        transactions: transactionsResult.success ? {
          count: transactionsResult.data?.length || 0,
          sample: transactionsResult.data?.slice(0, 2) || []
        } : { error: 'Failed to load transactions' }
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(testData);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
