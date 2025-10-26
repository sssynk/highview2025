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
  AttendanceDispute,
  StudentAttendanceRecord,
  Instructor,
  SessionResource,
  SessionWithDetails,
  ProgressDataPoint,
} from './types';
import { revalidatePath } from 'next/cache';
import { mockStudentData, mockUpcomingSessions, mockDisputes, mockSessionDetails, mockProgressChartData } from './mock-data';

const MOCK_MODE = process.env.MOCK_MODE === 'true';

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

export async function getStudentAttendance(student_id: string): Promise<StudentAttendanceRecord[]> {
  try {
    const result = await query(`
      SELECT 
        s.session_id,
        s.name as session_name,
        s.date,
        sa.points
      FROM sessions s
      LEFT JOIN session_attendance sa ON s.session_id = sa.session_id AND sa.student_id = $1
      ORDER BY s.date DESC
    `, [student_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return [];
  }
}

export async function getStudentWithDetails(student_id: string) {
  if (MOCK_MODE) {
    return mockStudentData;
  }
  
  try {
    const studentResult = await query(
      'SELECT * FROM students WHERE student_id = $1',
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return null;
    }

    const student = studentResult.rows[0];
    const attendance = await getStudentAttendance(student_id);
    
    const pointsResult = await query(`
      SELECT 
        COALESCE(SUM(sa.points), 0) as total_session_points,
        COALESCE(SUM(ep.points), 0) as total_extra_points
      FROM students s
      LEFT JOIN session_attendance sa ON s.student_id = sa.student_id
      LEFT JOIN extra_points ep ON s.student_id = ep.student_id
      WHERE s.student_id = $1
      GROUP BY s.student_id
    `, [student_id]);

    const totalSessionPoints = parseFloat(pointsResult.rows[0]?.total_session_points || 0);
    const totalExtraPoints = parseFloat(pointsResult.rows[0]?.total_extra_points || 0);

    return {
      ...student,
      attendance,
      total_session_points: totalSessionPoints,
      total_extra_points: totalExtraPoints,
      total_points: totalSessionPoints + totalExtraPoints,
    };
  } catch (error) {
    console.error('Error fetching student details:', error);
    return null;
  }
}

export async function createAttendanceDispute(data: {
  student_id: string;
  session_id: string;
  message: string;
}) {
  try {
    await query(
      'INSERT INTO attendance_disputes (student_id, session_id, message) VALUES ($1, $2, $3)',
      [data.student_id, data.session_id, data.message]
    );
    revalidatePath('/student');
    return { success: true };
  } catch (error) {
    console.error('Error creating attendance dispute:', error);
    return { success: false, error: String(error) };
  }
}

export async function getStudentDisputes(student_id: string): Promise<AttendanceDispute[]> {
  if (MOCK_MODE) {
    return mockDisputes;
  }
  
  try {
    const result = await query(
      `SELECT 
        ad.*,
        s.name as session_name,
        s.date
      FROM attendance_disputes ad
      JOIN sessions s ON ad.session_id = s.session_id
      WHERE ad.student_id = $1
      ORDER BY ad.created_at DESC`,
      [student_id]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching student disputes:', error);
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

export async function getUpcomingSessions(): Promise<Session[]> {
  if (MOCK_MODE) {
    return mockUpcomingSessions;
  }
  
  try {
    const result = await query(
      'SELECT * FROM sessions WHERE date >= CURRENT_DATE ORDER BY date ASC, name'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    return [];
  }
}

export async function getSessionDetails(
  session_id: string
): Promise<SessionWithDetails | null> {
  if (MOCK_MODE) {
    return mockSessionDetails as unknown as SessionWithDetails;
  }
  
  try {
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE session_id = $1',
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return null;
    }

    const instructorsResult = await query(
      `SELECT i.* 
       FROM instructors i
       JOIN session_instructors si ON i.instructor_id = si.instructor_id
       WHERE si.session_id = $1`,
      [session_id]
    );

    const resourcesResult = await query(
      'SELECT * FROM session_resources WHERE session_id = $1 ORDER BY created_at ASC',
      [session_id]
    );

    return {
      ...sessionResult.rows[0],
      instructors: instructorsResult.rows,
      resources: resourcesResult.rows,
    };
  } catch (error) {
    console.error('Error fetching session details:', error);
    return null;
  }
}

export async function getStudentProgressChart(
  student_id: string
): Promise<ProgressDataPoint[]> {
  if (MOCK_MODE) {
    return mockProgressChartData;
  }
  
  try {
    const result = await query(
      `SELECT 
        s.date,
        sa.points,
        SUM(sa.points) OVER (ORDER BY s.date ASC) as cumulative_points
      FROM sessions s
      LEFT JOIN session_attendance sa ON s.session_id = sa.session_id AND sa.student_id = $1
      ORDER BY s.date ASC`,
      [student_id]
    );
    
    return result.rows.map((row: { date: string; points: string | null; cumulative_points: string | null }) => ({
      date: row.date,
      points: parseFloat(row.points || '0'),
      cumulative_points: parseFloat(row.cumulative_points || '0'),
    }));
  } catch (error) {
    console.error('Error fetching progress chart data:', error);
    return [];
  }
}

export async function generateGoogleCalendarLink(session: Session): Promise<string> {
  const title = encodeURIComponent(session.name);
  const date = new Date(session.date);
  const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const details = encodeURIComponent(session.description || '');
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
}

