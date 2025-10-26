export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  company: string;
  created_at?: Date;
}

export interface Session {
  session_id: string;
  name: string;
  date: string;
  created_at?: Date;
}

export interface SessionAttendance {
  id?: number;
  student_id: string;
  session_id: string;
  points: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ExtraPoints {
  id?: number;
  student_id: string;
  source: string;
  points: number;
  created_at?: Date;
}

export interface StudentWithPoints extends Student {
  total_session_points: number;
  total_extra_points: number;
  total_points: number;
  sessions_attended: number;
  total_sessions: number;
}

export interface SessionWithAttendance extends Session {
  attendance: {
    student_id: string;
    student_name: string;
    company: string;
    points: number;
  }[];
}

// Generate random ID
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

