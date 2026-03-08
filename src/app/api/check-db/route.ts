import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('=== SIMPLE DATABASE INITIALIZATION ===');
    
    // Try to create the user table by creating a user
    // This will fail if tables don't exist, but let's try a different approach
    try {
      // Test if we can connect to database
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Try to count users to see if tables exist
      const userCount = await prisma.user.count();
      console.log('✅ Tables exist, user count:', userCount);
      
      return NextResponse.json({
        success: true,
        message: 'Database is already initialized',
        userCount: userCount,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error: any) {
      console.error('Database connection error:', error.message);
      
      // If tables don't exist, we need to provide a helpful message
      if (error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
        return NextResponse.json({
          success: false,
          error: 'Database tables do not exist',
          message: 'The database schema needs to be created. Please run Prisma migrations manually or check your DATABASE_URL.',
          suggestion: 'Run: prisma db push --force-reset locally, then redeploy',
          details: error.message,
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Database init error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
