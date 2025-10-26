#!/usr/bin/env node

/**
 * Database Migration Script
 * Run this script once to create all database tables
 * 
 * Usage: node scripts/migrate.js
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

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...\n');
    
    await client.query('BEGIN');

    // Create students table
    console.log('📋 Creating students table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created\n');

    // Create sessions table
    console.log('📋 Creating sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sessions table created\n');

    // Create session_attendance table
    console.log('📋 Creating session_attendance table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_attendance (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        session_id VARCHAR(50) REFERENCES sessions(session_id) ON DELETE CASCADE,
        points DECIMAL(3,1) DEFAULT 0 CHECK (points IN (0, 2.5, 5)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, session_id)
      )
    `);
    console.log('✅ Session_attendance table created\n');

    // Create extra_points table
    console.log('📋 Creating extra_points table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS extra_points (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        source VARCHAR(200) NOT NULL,
        points DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Extra_points table created\n');

    // Create indexes
    console.log('📋 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_attendance_student 
      ON session_attendance(student_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_attendance_session 
      ON session_attendance(session_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_extra_points_student 
      ON extra_points(student_id)
    `);
    console.log('✅ Indexes created\n');

    await client.query('COMMIT');
    
    console.log('🎉 Migration completed successfully!\n');
    console.log('Your database is ready to use.');
    console.log('Run: npm run dev');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error('❌ Failed to run migrations:', error);
  process.exit(1);
});

