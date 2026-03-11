import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/actions/account-actions';

export async function GET() {
  try {
    console.log('🔍 Testing accounts API endpoint...');
    
    const result = await getAccounts();
    
    console.log('Accounts result:', result);
    
    return NextResponse.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Accounts API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
