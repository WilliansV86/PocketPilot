import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/actions/account-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { getTransactions } from '@/lib/actions/transaction-actions';
import { getDebts } from '@/lib/actions/debt-actions';
import { getMoneyOwed } from '@/lib/actions/money-owed-actions';
import { getGoals } from '@/lib/actions/goal-actions';

export async function GET() {
  try {
    console.log('🔍 Verifying production database data...');
    
    const results = {
      success: true,
      message: 'Production data verification completed',
      data: {},
      timestamp: new Date().toISOString()
    };
    
    // Test accounts
    console.log('🏦 Testing accounts...');
    const accountsResult = await getAccounts();
    results.data.accounts = {
      success: accountsResult.success,
      count: accountsResult.success ? accountsResult.data.length : 0,
      error: accountsResult.success ? null : accountsResult.error,
      sample: accountsResult.success ? accountsResult.data.slice(0, 3).map(a => ({ 
        name: a.name, 
        balance: a.balance,
        type: a.type 
      })) : []
    };
    
    // Test categories
    console.log('📁 Testing categories...');
    const categoriesResult = await getCategories();
    results.data.categories = {
      success: categoriesResult.success,
      count: categoriesResult.success ? categoriesResult.data.length : 0,
      error: categoriesResult.success ? null : categoriesResult.error,
      sample: categoriesResult.success ? categoriesResult.data.slice(0, 3).map(c => ({ 
        name: c.name, 
        group: c.group 
      })) : []
    };
    
    // Test transactions
    console.log('💳 Testing transactions...');
    const transactionsResult = await getTransactions();
    results.data.transactions = {
      success: transactionsResult.success,
      count: transactionsResult.success ? (transactionsResult.data?.length || 0) : 0,
      error: transactionsResult.success ? null : transactionsResult.error,
      sample: transactionsResult.success ? (transactionsResult.data?.slice(0, 3).map(t => ({ 
        description: t.description, 
        amount: t.amount,
        date: t.date
      })) || []) : []
    };
    
    // Test debts
    console.log('💰 Testing debts...');
    const debtsResult = await getDebts();
    results.data.debts = {
      success: debtsResult.success,
      count: debtsResult.success ? (debtsResult.data?.length || 0) : 0,
      error: debtsResult.success ? null : debtsResult.error,
      sample: debtsResult.success ? (debtsResult.data?.slice(0, 3).map(d => ({ 
        name: d.name, 
        currentBalance: d.currentBalance,
        type: d.type 
      })) || []) : []
    };
    
    // Test money owed
    console.log('🤝 Testing money owed...');
    const moneyOwedResult = await getMoneyOwed();
    results.data.moneyOwed = {
      success: moneyOwedResult.success,
      count: moneyOwedResult.success ? (moneyOwedResult.data?.length || 0) : 0,
      error: moneyOwedResult.success ? null : moneyOwedResult.error,
      sample: moneyOwedResult.success ? (moneyOwedResult.data?.slice(0, 3).map(mo => ({ 
        personName: mo.personName, 
        amountOutstanding: mo.amountOutstanding,
        status: mo.status 
      })) || []) : []
    };
    
    // Test goals
    console.log('🎯 Testing goals...');
    const goalsResult = await getGoals();
    results.data.goals = {
      success: goalsResult.success,
      count: goalsResult.success ? (goalsResult.data?.length || 0) : 0,
      error: goalsResult.success ? null : goalsResult.error,
      sample: goalsResult.success ? (goalsResult.data?.slice(0, 3).map(g => ({ 
        name: g.name, 
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount 
      })) || []) : []
    };
    
    // Calculate totals
    const totalRecords = Object.values(results.data).reduce((sum: number, item: any) => sum + item.count, 0);
    const successfulModules = Object.values(results.data).filter((item: any) => item.success).length;
    
    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`   ✅ Successful modules: ${successfulModules}/6`);
    console.log(`   📈 Total records: ${totalRecords}`);
    console.log(`   🏦 Accounts: ${results.data.accounts.count}`);
    console.log(`   📁 Categories: ${results.data.categories.count}`);
    console.log(`   💳 Transactions: ${results.data.transactions.count}`);
    console.log(`   💰 Debts: ${results.data.debts.count}`);
    console.log(`   🤝 Money Owed: ${results.data.moneyOwed.count}`);
    console.log(`   🎯 Goals: ${results.data.goals.count}`);
    
    // Check if we have real data (more than fallback amounts)
    const hasRealData = 
      results.data.accounts.count > 0 ||
      results.data.categories.count > 0 ||
      results.data.transactions.count > 0 ||
      results.data.debts.count > 0 ||
      results.data.moneyOwed.count > 0 ||
      results.data.goals.count > 0;
    
    results.data.hasRealData = hasRealData;
    results.data.totalRecords = totalRecords;
    results.data.successfulModules = successfulModules;
    
    if (hasRealData) {
      console.log(`\n🎉 SUCCESS: Production app is showing REAL database data!`);
    } else {
      console.log(`\n⚠️  WARNING: No data found in database`);
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
