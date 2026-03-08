import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== RUNNING PRISMA MIGRATIONS ===');
    
    const { execSync } = require('child_process');
    
    try {
      // Run Prisma migrations
      console.log('Executing prisma migrate deploy...');
      const migrateOutput = execSync('npx prisma migrate deploy', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('Migration output:', migrateOutput);
      
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
        message: 'Database migrations completed successfully',
        migrationOutput: migrateOutput,
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
