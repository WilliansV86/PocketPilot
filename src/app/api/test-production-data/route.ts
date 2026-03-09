import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/actions/account-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { getTransactions } from '@/lib/actions/transaction-actions';

export async function GET() {
  try {
    console.log('🔍 Testing production fallback data...');
    
    // Test accounts
    const accountsResult = await getAccounts();
    const accountCount = accountsResult.success ? accountsResult.data.length : 0;
    
    // Test categories
    const categoriesResult = await getCategories();
    const categoryCount = categoriesResult.success ? categoriesResult.data.length : 0;
    
    // Test transactions
    const transactionsResult = await getTransactions();
    const transactionCount = transactionsResult.success ? transactionsResult.data?.length || 0 : 0;
    
    const testData = {
      success: true,
      message: 'Production fallback data test completed',
      data: {
        accounts: {
          count: accountCount,
          expected: 9,
          matches: accountCount === 9,
          sample: accountsResult.success ? accountsResult.data.slice(0, 3).map(a => ({ name: a.name, balance: a.balance })) : []
        },
        categories: {
          count: categoryCount,
          expected: 20,
          matches: categoryCount === 20,
          sample: categoriesResult.success ? categoriesResult.data.slice(0, 3).map(c => ({ name: c.name, group: c.group })) : []
        },
        transactions: {
          count: transactionCount,
          expected: 6,
          matches: transactionCount === 6,
          sample: transactionsResult.success ? transactionsResult.data?.slice(0, 3).map(t => ({ description: t.description, amount: t.amount })) || [] : []
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Log results
    console.log(`✅ Test Results:`);
    console.log(`   Accounts: ${accountCount}/9 ${accountCount === 9 ? '✅' : '❌'}`);
    console.log(`   Categories: ${categoryCount}/20 ${categoryCount === 20 ? '✅' : '❌'}`);
    console.log(`   Transactions: ${transactionCount}/6 ${transactionCount === 6 ? '✅' : '❌'}`);
    
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
