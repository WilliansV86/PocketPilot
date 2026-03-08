import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('=== INITIALIZING DATABASE WITH PRISMA ===');
    
    // Test basic database connection
    try {
      // Try to count users - this will tell us if tables exist
      const userCount = await prisma.user.count();
      console.log('Database connection successful, user count:', userCount);
      
      return NextResponse.json({
        success: true,
        message: 'Database is already initialized',
        userCount: userCount,
        timestamp: new Date().toISOString(),
      });
      
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      
      // If tables don't exist, we need to inform about the issue
      if (dbError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Database tables do not exist. Prisma migrations need to be run during build.',
          suggestion: 'The build script should include: prisma migrate deploy || prisma db push',
          details: dbError.message,
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }
      
      throw dbError;
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
