import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    
    // Test basic database connection without Prisma
    const { Pool } = require('pg');
    
    const databaseUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL exists:', !!databaseUrl);
    console.log('DATABASE_URL length:', databaseUrl?.length);
    console.log('DATABASE_URL starts with postgres:', databaseUrl?.startsWith('postgres://'));
    
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    
    try {
      // Test basic connection
      const client = await pool.connect();
      console.log('✅ Raw database connection successful');
      
      // List all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('Tables found:', tablesResult.rows.length);
      tablesResult.rows.forEach(row => {
        console.log('- ' + row.table_name);
      });
      
      // Test if we can create a simple table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_table (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Can create tables');
        
        // Clean up
        await client.query('DROP TABLE IF EXISTS test_table');
        console.log('✅ Can drop tables');
      } catch (createError: any) {
        console.error('❌ Cannot create tables:', createError.message);
      }
      
      client.release();
      await pool.end();
      
      return NextResponse.json({
        success: true,
        message: 'Database connection test completed',
        database: {
          urlExists: !!databaseUrl,
          urlLength: databaseUrl?.length,
          tables: tablesResult.rows,
          tableCount: tablesResult.rows.length
        },
        timestamp: new Date().toISOString(),
      });
      
    } catch (dbError: any) {
      console.error('❌ Database connection error:', dbError);
      
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError.message,
        database: {
          urlExists: !!databaseUrl,
          urlLength: databaseUrl?.length,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
