import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== RUNNING PRISMA MIGRATIONS ===');
    
    const { execSync } = require('child_process');
    
    try {
      // Use Prisma push for serverless environments
      console.log('Executing prisma db push...');
      const pushOutput = execSync('npx prisma db push --force-reset', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('Push output:', pushOutput);
      
      // Generate Prisma Client
      console.log('Generating Prisma Client...');
      const generateOutput = execSync('npx prisma generate', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('Generate output:', generateOutput);
      
      console.log('=== MIGRATIONS COMPLETED SUCCESSFULLY ===');
      
      return NextResponse.json({
        success: true,
        message: 'Database schema created successfully using prisma db push',
        pushOutput: pushOutput,
        generateOutput: generateOutput,
        timestamp: new Date().toISOString(),
      });
      
    } catch (migrationError: any) {
      console.error('Migration error:', migrationError);
      return NextResponse.json({
        success: false,
        error: `Migration failed: ${migrationError.message}`,
        details: migrationError.stdout || migrationError.stderr,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
