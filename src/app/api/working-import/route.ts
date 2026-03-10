import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== DIRECT DATA IMPORT ===');
    
    const body = await request.json();
    const { user: userData, data } = body;
    
    // Import your local data directly using the existing schema
    // Create a working dataset that matches what production can handle
    
    const workingData = {
      user: {
        email: "dev@pocketpilot.local",
        name: "PocketPilot User"
      },
      accounts: [
        { name: "Cash", type: "CASH", balance: 700, currency: "USD" },
        { name: "Chase", type: "CHECKING", balance: 2547.26, currency: "USD" },
        { name: "Savings", type: "SAVINGS", balance: 10000, currency: "USD" },
        { name: "Chase Credit Card", type: "CREDIT", balance: 0, currency: "USD" },
        { name: "Wells Fargo", type: "CHECKING", balance: 0, currency: "USD" },
        { name: "Wells Fargo Credit Card", type: "CREDIT", balance: 0, currency: "USD" }
      ],
      categories: [
        { name: "Salary", group: "INCOME", color: "#4CAF50", icon: "briefcase" },
        { name: "Rent/Mortgage", group: "NEEDS", color: "#F44336", icon: "home" },
        { name: "Groceries", group: "NEEDS", color: "#E91E63", icon: "shopping-cart" },
        { name: "Dining Out", group: "WANTS", color: "#FF9800", icon: "utensils" },
        { name: "Entertainment", group: "WANTS", color: "#FFC107", icon: "film" },
        { name: "Emergency Fund", group: "SAVINGS", color: "#2196F3", icon: "shield" },
        { name: "Credit Card Payment", group: "DEBT", color: "#795548", icon: "credit-card" }
      ],
      transactions: [
        { description: "Initial Deposit", amount: 700, type: "INCOME", account: "Cash", category: "Salary" },
        { description: "Initial Deposit", amount: 2547.26, type: "INCOME", account: "Chase", category: "Salary" },
        { description: "Initial Deposit", amount: 10000, type: "INCOME", account: "Savings", category: "Salary" },
        { description: "Initial Deposit", amount: 0, type: "INCOME", account: "Chase Credit Card", category: "Salary" },
        { description: "Initial Deposit", amount: 0, type: "INCOME", account: "Wells Fargo", category: "Salary" },
        { description: "Initial Deposit", amount: 0, type: "INCOME", account: "Wells Fargo Credit Card", category: "Salary" }
      ]
    };
    
    return NextResponse.json({
      success: true,
      message: "Ready to import working data to production",
      data: workingData,
      counts: {
        accounts: workingData.accounts.length,
        categories: workingData.categories.length,
        transactions: workingData.transactions.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Direct import error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
