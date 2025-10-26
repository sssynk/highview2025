import { Pool } from 'pg';

const MOCK_MODE = process.env.MOCK_MODE === 'true';

let pool: Pool | null = null;

if (!MOCK_MODE) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export const query = async (text: string, params?: unknown[]) => {
  if (MOCK_MODE) {
    return { rows: [], rowCount: 0 };
  }
  
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  if (MOCK_MODE || !pool) {
    throw new Error('Database not available in mock mode');
  }
  const client = await pool.connect();
  return client;
};

// Initialize database schema
export const initializeDatabase = async () => {
  if (MOCK_MODE) {
    console.log('Mock mode: skipping database initialization');
    return;
  }
  
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session_attendance table
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

    // Create extra_points table
    await client.query(`
      CREATE TABLE IF NOT EXISTS extra_points (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        source VARCHAR(200) NOT NULL,
        points DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance_disputes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_disputes (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        session_id VARCHAR(50) REFERENCES sessions(session_id) ON DELETE CASCADE,
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        instructor_response TEXT
      )
    `);

    // Create instructors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS instructors (
        instructor_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session_instructors table (many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_instructors (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(50) REFERENCES sessions(session_id) ON DELETE CASCADE,
        instructor_id VARCHAR(50) REFERENCES instructors(instructor_id) ON DELETE CASCADE,
        UNIQUE(session_id, instructor_id)
      )
    `);

    // Create session_resources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_resources (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(50) REFERENCES sessions(session_id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('slide', 'link', 'note', 'recording')),
        title VARCHAR(200) NOT NULL,
        url TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
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

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_disputes_student 
      ON attendance_disputes(student_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_instructors_session 
      ON session_instructors(session_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_resources_session 
      ON session_resources(session_id)
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;

