'use server';

import { query, initializeDatabase } from './db';
import {
  Student,
  Session,
  SessionAttendance,
  ExtraPoints,
  StudentWithPoints,
  SessionWithAttendance,
  generateId,
} from './types';
import { revalidatePath } from 'next/cache';

// Initialize database on first run
export async function setupDatabase() {
  try {
    await initializeDatabase();
    return { success: true };
  } catch (error) {
    console.error('Database setup error:', error);
    return { success: false, error: String(error) };
  }
}

// ========== STUDENT ACTIONS ==========

export async function getStudents(): Promise<Student[]> {
  try {
    const result = await query(
      'SELECT * FROM students ORDER BY last_name, first_name'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function getStudentsWithPoints(): Promise<StudentWithPoints[]> {
  try {
    const result = await query(`
      SELECT 
        s.*,
        COALESCE(SUM(sa.points), 0) as total_session_points,
        COALESCE(SUM(ep.points), 0) as total_extra_points,
        COALESCE(SUM(sa.points), 0) + COALESCE(SUM(ep.points), 0) as total_points,
        COUNT(DISTINCT CASE WHEN sa.points > 0 THEN sa.session_id END) as sessions_attended,
        COUNT(DISTINCT sess.session_id) as total_sessions
      FROM students s
      LEFT JOIN session_attendance sa ON s.student_id = sa.student_id
      LEFT JOIN extra_points ep ON s.student_id = ep.student_id
      LEFT JOIN sessions sess ON 1=1
      GROUP BY s.student_id, s.first_name, s.last_name, s.company, s.created_at
      ORDER BY total_points DESC, s.last_name, s.first_name
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching students with points:', error);
    return [];
  }
}

export async function addStudent(data: {
  first_name: string;
  last_name: string;
  company: string;
}) {
  try {
    const student_id = generateId('STU');
    await query(
      'INSERT INTO students (student_id, first_name, last_name, company) VALUES ($1, $2, $3, $4)',
      [student_id, data.first_name, data.last_name, data.company]
    );

    // Add attendance records for all existing sessions with 0 points
    await query(`
      INSERT INTO session_attendance (student_id, session_id, points)
      SELECT $1, session_id, 0
      FROM sessions
      ON CONFLICT (student_id, session_id) DO NOTHING
    `, [student_id]);

    revalidatePath('/students');
    return { success: true, student_id };
  } catch (error) {
    console.error('Error adding student:', error);
    return { success: false, error: String(error) };
  }
}

export async function importStudents(students: Array<{
  first_name: string;
  last_name: string;
  company: string;
}>) {
  try {
    const studentIds: string[] = [];
    
    for (const student of students) {
      const student_id = generateId('STU');
      await query(
        'INSERT INTO students (student_id, first_name, last_name, company) VALUES ($1, $2, $3, $4)',
        [student_id, student.first_name, student.last_name, student.company]
      );
      studentIds.push(student_id);

      // Add attendance records for all existing sessions with 0 points
      await query(`
        INSERT INTO session_attendance (student_id, session_id, points)
        SELECT $1, session_id, 0
        FROM sessions
        ON CONFLICT (student_id, session_id) DO NOTHING
      `, [student_id]);
    }

    revalidatePath('/students');
    return { success: true, count: students.length, studentIds };
  } catch (error) {
    console.error('Error importing students:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteStudent(student_id: string) {
  try {
    await query('DELETE FROM students WHERE student_id = $1', [student_id]);
    revalidatePath('/students');
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: String(error) };
  }
}

// ========== SESSION ACTIONS ==========

export async function getSessions(): Promise<Session[]> {
  try {
    const result = await query(
      'SELECT * FROM sessions ORDER BY date DESC, name'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

export async function getSessionWithAttendance(
  session_id: string
): Promise<SessionWithAttendance | null> {
  try {
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE session_id = $1',
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return null;
    }

    const attendanceResult = await query(
      `SELECT 
        sa.student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.company,
        sa.points
      FROM session_attendance sa
      JOIN students s ON sa.student_id = s.student_id
      WHERE sa.session_id = $1
      ORDER BY s.last_name, s.first_name`,
      [session_id]
    );

    return {
      ...sessionResult.rows[0],
      attendance: attendanceResult.rows,
    };
  } catch (error) {
    console.error('Error fetching session with attendance:', error);
    return null;
  }
}

export async function addSession(data: { name: string; date: string }) {
  try {
    const session_id = generateId('SES');
    await query(
      'INSERT INTO sessions (session_id, name, date) VALUES ($1, $2, $3)',
      [session_id, data.name, data.date]
    );

    // Create attendance records for all existing students with 0 points
    await query(`
      INSERT INTO session_attendance (student_id, session_id, points)
      SELECT student_id, $1, 0
      FROM students
      ON CONFLICT (student_id, session_id) DO NOTHING
    `, [session_id]);

    revalidatePath('/sessions');
    return { success: true, session_id };
  } catch (error) {
    console.error('Error adding session:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteSession(session_id: string) {
  try {
    await query('DELETE FROM sessions WHERE session_id = $1', [session_id]);
    revalidatePath('/sessions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: String(error) };
  }
}

// ========== ATTENDANCE ACTIONS ==========

export async function updateAttendance(
  student_id: string,
  session_id: string,
  points: number
) {
  try {
    await query(
      `INSERT INTO session_attendance (student_id, session_id, points, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (student_id, session_id)
       DO UPDATE SET points = $3, updated_at = CURRENT_TIMESTAMP`,
      [student_id, session_id, points]
    );
    revalidatePath('/sessions');
    return { success: true };
  } catch (error) {
    console.error('Error updating attendance:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAttendanceForSession(
  session_id: string
): Promise<SessionAttendance[]> {
  try {
    const result = await query(
      'SELECT * FROM session_attendance WHERE session_id = $1',
      [session_id]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
}

// ========== EXTRA POINTS ACTIONS ==========

export async function addExtraPoints(data: {
  student_id: string;
  source: string;
  points: number;
}) {
  try {
    await query(
      'INSERT INTO extra_points (student_id, source, points) VALUES ($1, $2, $3)',
      [data.student_id, data.source, data.points]
    );
    revalidatePath('/students');
    return { success: true };
  } catch (error) {
    console.error('Error adding extra points:', error);
    return { success: false, error: String(error) };
  }
}

export async function getExtraPointsForStudent(
  student_id: string
): Promise<ExtraPoints[]> {
  try {
    const result = await query(
      'SELECT * FROM extra_points WHERE student_id = $1 ORDER BY created_at DESC',
      [student_id]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching extra points:', error);
    return [];
  }
}

export async function deleteExtraPoints(id: number) {
  try {
    await query('DELETE FROM extra_points WHERE id = $1', [id]);
    revalidatePath('/students');
    return { success: true };
  } catch (error) {
    console.error('Error deleting extra points:', error);
    return { success: false, error: String(error) };
  }
}

// ========== DASHBOARD STATS ==========

export async function getDashboardStats() {
  try {
    const studentsResult = await query('SELECT COUNT(*) FROM students');
    const sessionsResult = await query('SELECT COUNT(*) FROM sessions');
    const avgPointsResult = await query(`
      SELECT AVG(total_points) as avg_points
      FROM (
        SELECT 
          s.student_id,
          COALESCE(SUM(sa.points), 0) + COALESCE(SUM(ep.points), 0) as total_points
        FROM students s
        LEFT JOIN session_attendance sa ON s.student_id = sa.student_id
        LEFT JOIN extra_points ep ON s.student_id = ep.student_id
        GROUP BY s.student_id
      ) AS student_totals
    `);
    const topStudentsResult = await query(`
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.company,
        COALESCE(SUM(sa.points), 0) + COALESCE(SUM(ep.points), 0) as total_points
      FROM students s
      LEFT JOIN session_attendance sa ON s.student_id = sa.student_id
      LEFT JOIN extra_points ep ON s.student_id = ep.student_id
      GROUP BY s.student_id, s.first_name, s.last_name, s.company
      ORDER BY total_points DESC
      LIMIT 5
    `);

    return {
      totalStudents: parseInt(studentsResult.rows[0].count),
      totalSessions: parseInt(sessionsResult.rows[0].count),
      averagePoints: parseFloat(avgPointsResult.rows[0].avg_points || 0).toFixed(1),
      topStudents: topStudentsResult.rows,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalStudents: 0,
      totalSessions: 0,
      averagePoints: '0',
      topStudents: [],
    };
  }
}

