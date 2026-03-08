import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDefaultUser } from '@/lib/get-default-user';

export async function GET() {
  try {
    console.log('=== DEBUG: User resolution ===');
    
    // Test the getDefaultUser function
    const defaultUser = await getDefaultUser();
    
    // Get all users to see what's in the database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    
    // Test what user queries are returning
    const userByEmail = await prisma.user.findUnique({
      where: { email: 'dev@pocketpilot.local' },
      select: { id: true, email: true, name: true }
    });
    
    const firstUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true }
    });
    
    const debugInfo = {
      currentUser: {
        id: defaultUser.id,
        email: defaultUser.email,
        name: defaultUser.name
      },
      allUsers,
      queries: {
        userByEmail,
        firstUser
      },
      database: {
        totalUsers: allUsers.length,
        defaultUserEmail: 'dev@pocketpilot.local'
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };
    
    console.log('=== DEBUG: User resolution complete ===', {
      currentUser: debugInfo.currentUser.email,
      totalUsers: debugInfo.database.totalUsers
    });
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('❌ DEBUG: User resolution error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
