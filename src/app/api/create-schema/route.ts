import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  return prisma;
}

export async function POST() {
  try {
    console.log('=== RUNTIME DATABASE INITIALIZATION ===');
    
    const client = getPrismaClient();
    
    // Test basic connection
    await client.$connect();
    console.log('✅ Database connection established');
    
    // Try to create a simple user to test if tables exist
    try {
      const userCount = await client.user.count();
      console.log('✅ Tables already exist, user count:', userCount);
      
      return NextResponse.json({
        success: true,
        message: 'Database is already initialized',
        userCount: userCount,
        timestamp: new Date().toISOString(),
      });
      
    } catch (tableError: any) {
      console.log('❌ Tables do not exist, attempting to create schema...');
      
      // Since we can't run migrations in serverless, let's try to create the database
      // using a different approach - we'll create the minimal schema needed
      
      try {
        // Try to create the User table manually using raw SQL
        await client.$executeRaw`
          CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id")
          );
        `;
        console.log('✅ User table created');
        
        // Create other essential tables
        await client.$executeRaw`
          CREATE TABLE IF NOT EXISTS "FinancialAccount" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "balance" REAL NOT NULL,
            "currency" TEXT NOT NULL DEFAULT 'USD',
            "userId" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id"),
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE ON CASCADE
          );
        `;
        console.log('✅ FinancialAccount table created');
        
        await client.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Category" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "group" TEXT NOT NULL,
            "color" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "isArchived" BOOLEAN NOT NULL DEFAULT false,
            "icon" TEXT NOT NULL DEFAULT 'tag',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id"),
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE ON CASCADE
          );
        `;
        console.log('✅ Category table created');
        
        await client.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Transaction" (
            "id" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "amount" REAL NOT NULL,
            "date" DATETIME NOT NULL,
            "type" TEXT NOT NULL,
            "accountId" TEXT NOT NULL,
            "categoryId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id"),
            FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE ON CASCADE,
            FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE ON CASCADE,
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE ON CASCADE
          );
        `;
        console.log('✅ Transaction table created');
        
        // Test the schema by creating a user
        const testUser = await client.user.create({
          data: {
            id: 'test-user-init',
            name: 'Test User',
            email: 'test@pocketpilot.local',
          },
        });
        console.log('✅ Schema test successful, created test user');
        
        // Clean up test user
        await client.user.delete({
          where: { id: 'test-user-init' },
        });
        console.log('✅ Test user cleaned up');
        
        return NextResponse.json({
          success: true,
          message: 'Database schema created successfully using raw SQL',
          tablesCreated: ['User', 'FinancialAccount', 'Category', 'Transaction'],
          timestamp: new Date().toISOString(),
        });
        
      } catch (sqlError: any) {
        console.error('❌ SQL schema creation failed:', sqlError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create database schema',
          details: sqlError.message,
          suggestion: 'Database may not have proper permissions or connection',
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error('❌ Database init error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    try {
      await prisma?.$disconnect();
    } catch (e) {
      console.log('Disconnect error:', e);
    }
  }
}
