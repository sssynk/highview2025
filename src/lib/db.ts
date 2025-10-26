import { Pool } from 'pg';

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

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Initialize database schema
export const initializeDatabase = async () => {
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_notes (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS session_tasks (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(50) REFERENCES sessions(session_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS student_task_completions (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES session_tasks(id) ON DELETE CASCADE,
        student_id VARCHAR(50) REFERENCES students(student_id) ON DELETE CASCADE,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, student_id)
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
      CREATE INDEX IF NOT EXISTS idx_student_notes_student 
      ON student_notes(student_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_tasks_session 
      ON session_tasks(session_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_task_completions_student 
      ON student_task_completions(student_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_task_completions_task 
      ON student_task_completions(task_id)
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
