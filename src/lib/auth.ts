'use server';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from './db';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'professor' | 'student' | null;
  student_id?: string | null;
  created_at?: Date;
}

export interface Session {
  userId: number;
  email: string;
  role: 'admin' | 'professor' | 'student' | null;
  studentId?: string | null;
}

// Simple session management (in production, use proper session store)
const COOKIE_NAME = 'highview_session';

export async function signup(email: string, password: string) {
  try {
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (no role assigned yet)
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
      [email, passwordHash]
    );

    return { 
      success: true, 
      message: 'Account created! Please wait for an admin to assign you a role.',
      user: result.rows[0]
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Failed to create account' };
  }
}

export async function login(email: string, password: string) {
  try {
    // Get user
    const result = await query(
      'SELECT id, email, password_hash, role, student_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if user has a role assigned
    if (!user.role) {
      return { 
        success: false, 
        error: 'Your account is pending approval. Please contact an administrator.' 
      };
    }

    // Create session
    const session: Session = {
      userId: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student_id,
    };

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true, user: { id: user.id, email: user.email, role: user.role, student_id: user.student_id } };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }

    const session: Session = JSON.parse(sessionCookie.value);
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { authenticated: false, session: null };
  }
  return { authenticated: true, session };
}

export async function requireRole(allowedRoles: Array<'admin' | 'professor' | 'student'>) {
  const session = await getSession();
  
  if (!session || !session.role) {
    return { authorized: false, session: null };
  }

  if (!allowedRoles.includes(session.role)) {
    return { authorized: false, session };
  }

  return { authorized: true, session };
}

// Admin user management functions
export async function getUsers() {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.student_id, u.created_at,
              s.first_name, s.last_name
       FROM users u
       LEFT JOIN students s ON u.student_id = s.student_id
       ORDER BY u.created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getStudents() {
  try {
    const result = await query(
      'SELECT student_id, first_name, last_name, company FROM students ORDER BY last_name, first_name'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function updateUserRole(
  userId: number, 
  role: 'admin' | 'professor' | 'student' | null,
  studentId?: string | null
) {
  try {
    // If role is student, student_id must be provided
    if (role === 'student' && !studentId) {
      return { success: false, error: 'Student role requires a student selection' };
    }
    
    // If role is not student, clear student_id
    const finalStudentId = role === 'student' ? studentId : null;
    
    await query(
      'UPDATE users SET role = $1, student_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [role, finalStudentId, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

export async function deleteUser(userId: number) {
  try {
    await query('DELETE FROM users WHERE id = $1', [userId]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

