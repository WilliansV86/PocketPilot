import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Checking production database state...');
    
    // Use raw PostgreSQL connection to check tables
    const { Pool } = require('pg');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found');
    }
    
    const client = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Check tables in different schemas
    const schemas = ['public', 'pocketpilot', 'schema'];
    let tableInfo = [];
    
    for (const schema of schemas) {
      try {
        const result = await client.query(`
          SELECT table_schema, table_name 
          FROM information_schema.tables 
          WHERE table_schema = '${schema}'
          ORDER BY table_name
        `);
        
        if (result.rows.length > 0) {
          tableInfo.push({
            schema: schema,
            tables: result.rows.map((row: any) => `${row.table_schema}.${row.table_name}`)
          });
        }
      } catch (error: any) {
        console.log(`Schema ${schema} error:`, error.message);
      }
    }
    
    // Check data in User table across schemas
    let userData = [];
    for (const schema of schemas) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${schema}"."User"`);
        if (result.rows[0].count > 0) {
          userData.push({
            schema: schema,
            userCount: parseInt(result.rows[0].count)
          });
        }
      } catch (error) {
        // Table doesn't exist in this schema
      }
    }
    
    await client.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database schema check completed',
      data: {
        databaseUrl: databaseUrl ? 'Present' : 'Missing',
        schemas: tableInfo,
        userData: userData
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
