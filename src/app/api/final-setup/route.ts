import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== FINAL PRODUCTION SETUP ===');
    
    // Since schema creation is failing, let's try a direct approach
    // using the existing setup endpoint but with your local data
    
    // First, let's create a simple user using raw SQL
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Database connected');
      
      // Try to create user with raw SQL
      await prisma.$executeRaw`
        INSERT INTO "User" (id, name, email, "createdAt", "updatedAt")
        VALUES ('user-1', 'PocketPilot User', 'dev@pocketpilot.local', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log('✅ User created/verified');
      
      // Now try to use the setup-production logic
      // But first, let's check if we can read the user
      const user = await prisma.user.findFirst();
      
      if (!user) {
        throw new Error('Still cannot create user - database permission issue');
      }
      
      console.log('✅ User found:', user.email);
      
      // Now create basic data using the setup approach
      // Create accounts
      await prisma.$executeRaw`
        INSERT INTO "FinancialAccount" (id, name, type, balance, currency, "userId", "createdAt", "updatedAt")
        VALUES 
          ('acc-1', 'Cash', 'CASH', 700, 'USD', 'user-1', NOW(), NOW()),
          ('acc-2', 'Chase', 'CHECKING', 2547.26, 'USD', 'user-1', NOW(), NOW()),
          ('acc-3', 'Savings', 'SAVINGS', 10000, 'USD', 'user-1', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log('✅ Accounts created');
      
      // Create categories
      await prisma.$executeRaw`
        INSERT INTO "Category" (id, name, "group", color, "userId", "isArchived", icon, "createdAt", "updatedAt")
        VALUES 
          ('cat-1', 'Salary', 'INCOME', '#4CAF50', 'user-1', false, 'briefcase', NOW(), NOW()),
          ('cat-2', 'Rent/Mortgage', 'NEEDS', '#F44336', 'user-1', false, 'home', NOW(), NOW()),
          ('cat-3', 'Groceries', 'NEEDS', '#E91E63', 'user-1', false, 'shopping-cart', NOW(), NOW()),
          ('cat-4', 'Dining Out', 'WANTS', '#FF9800', 'user-1', false, 'utensils', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log('✅ Categories created');
      
      // Create transactions
      await prisma.$executeRaw`
        INSERT INTO "Transaction" (id, description, amount, date, type, "accountId", "categoryId", "userId", "createdAt", "updatedAt")
        VALUES 
          ('tx-1', 'Initial Deposit', 10000, NOW(), 'INCOME', 'acc-3', 'cat-1', 'user-1', NOW(), NOW()),
          ('tx-2', 'Initial Deposit', 2547.26, NOW(), 'INCOME', 'acc-2', 'cat-1', 'user-1', NOW(), NOW()),
          ('tx-3', 'Initial Deposit', 700, NOW(), 'INCOME', 'acc-1', 'cat-1', 'user-1', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log('✅ Transactions created');
      
      // Get final counts
      const userCount = await prisma.user.count();
      const accountCount = await prisma.financialAccount.count();
      const transactionCount = await prisma.transaction.count();
      const categoryCount = await prisma.category.count();
      
      const result = {
        success: true,
        message: 'Production database setup completed successfully!',
        data: {
          userCount,
          accountCount,
          transactionCount,
          categoryCount,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ FINAL SETUP COMPLETE:', result.data);
      
      return NextResponse.json(result);
      
    } catch (dbError: any) {
      console.error('❌ Database operation failed:', dbError);
      
      return NextResponse.json({
        success: false,
        error: 'Database setup failed',
        details: dbError.message,
        suggestion: 'There may be a database permission or connection issue',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Final setup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
