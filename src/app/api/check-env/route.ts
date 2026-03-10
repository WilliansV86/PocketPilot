import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Checking production environment...');
    
    const envCheck = {
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      databaseUrlPreview: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'null',
      nodeEnv: process.env.NODE_ENV || 'not set',
      allEnvVars: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('db') || 
        key.toLowerCase().includes('database') ||
        key.toLowerCase().includes('neon')
      )
    };
    
    console.log('Environment check results:', envCheck);
    
    return NextResponse.json({
      success: true,
      message: 'Environment check completed',
      data: envCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
