#!/usr/bin/env node

/**
 * Database Status Checker
 * Check if database tables exist and show record counts
 * 
 * Usage: node scripts/db-status.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database status...\n');
    console.log('📍 Connection:', process.env.DB_HOST);
    console.log('📦 Database:', process.env.DB_NAME, '\n');

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found!');
      console.log('\n💡 Run: npm run migrate\n');
      return;
    }

    console.log('✅ Tables found:\n');
    
    const expectedTables = ['students', 'sessions', 'session_attendance', 'extra_points'];
    const foundTables = tablesResult.rows.map(row => row.table_name);
    
    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        // Get count
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`  ✅ ${table.padEnd(20)} (${count} records)`);
      } else {
        console.log(`  ❌ ${table.padEnd(20)} (missing)`);
      }
    }

    console.log('\n📊 Summary:');
    
    // Get total points across all students
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM session_attendance WHERE points > 0) as attended_sessions,
        (SELECT COALESCE(SUM(points), 0) FROM extra_points) as total_extra_points
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`  👥 Total Students: ${stats.total_students}`);
    console.log(`  📅 Total Sessions: ${stats.total_sessions}`);
    console.log(`  ✓ Attended Sessions: ${stats.attended_sessions}`);
    console.log(`  ⭐ Extra Points Awarded: ${stats.total_extra_points}`);

    console.log('\n✅ Database is ready!\n');
    
  } catch (error) {
    console.error('❌ Error checking database status:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Cannot connect to database. Check:');
      console.log('   - RDS instance is running');
      console.log('   - Security group allows your IP');
      console.log('   - .env.local has correct credentials\n');
    } else if (error.code === '42P01') {
      console.log('\n💡 Tables not found. Run: npm run migrate\n');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkStatus().catch((error) => {
  console.error('❌ Failed to check status:', error);
  process.exit(1);
});

