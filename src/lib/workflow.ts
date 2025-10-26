'use server';

import { Resend } from 'resend';
import { requireRole } from './auth';
import { query } from './db';

export interface AtRiskStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  missed_sessions: number;
}

type SendResult = {
  success: boolean;
  message: string;
  sentCount: number;
  failedCount: number;
  failures?: Array<{ email: string; error: string }>;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

let resendClient: Resend | null = null;

function getResendClient() {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    throw new Error('Resend environment variables are not fully configured.');
  }

  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }

  return resendClient;
}

async function hasWorkflowAccess() {
  const result = await requireRole(['admin', 'professor']);
  return result.authorized;
}

export async function getStudentsWithMissedSessions(minMissed = 3): Promise<AtRiskStudent[]> {
  const authorized = await hasWorkflowAccess();
  if (!authorized) {
    return [];
  }

  const result = await query(
    `
      SELECT
        s.student_id,
        s.first_name,
        s.last_name,
        u.email,
        COUNT(*)::int AS missed_sessions
      FROM session_attendance sa
      JOIN students s ON s.student_id = sa.student_id
      JOIN users u ON u.student_id = s.student_id
      WHERE sa.points = 0
        AND COALESCE(u.email, '') <> ''
      GROUP BY s.student_id, s.first_name, s.last_name, u.email
      HAVING COUNT(*) >= $1
      ORDER BY missed_sessions DESC, s.last_name, s.first_name
    `,
    [minMissed]
  );

  return result.rows as AtRiskStudent[];
}

function buildEmailContent(student: AtRiskStudent) {
  const subject = 'Attendance Reminder: Please catch up on missed sessions';
  const textBody = `Hi ${student.first_name},\n\nOur records show that you have missed ${student.missed_sessions} sessions so far. Please review the session materials and reach out if you need assistance catching up.\n\nThank you,\nHighview Team`;
  const htmlBody = `
    <p>Hi ${student.first_name},</p>
    <p>Our records show that you have missed <strong>${student.missed_sessions} sessions</strong> so far.</p>
    <p>Please review the session materials and let us know if you need any support catching up.</p>
    <p>Thank you,<br/>Highview Team</p>
  `;

  return { subject, textBody, htmlBody };
}

async function sendWithResend(students: AtRiskStudent[]): Promise<SendResult> {
  const client = getResendClient();

  let sentCount = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const student of students) {
    const { subject, textBody, htmlBody } = buildEmailContent(student);
    try {
      const { error } = await client.emails.send({
        from: RESEND_FROM_EMAIL,
        to: student.email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      if (error) {
        throw new Error(error.message ?? 'Resend API returned an error.');
      }

      sentCount += 1;
    } catch (error) {
      console.error('Resend send error', error);
      failures.push({ email: student.email, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return {
    success: failures.length === 0,
    message:
      failures.length === 0
        ? `Successfully sent ${sentCount} reminder emails with Resend.`
        : `Sent ${sentCount} emails with Resend, ${failures.length} failed.`,
    sentCount,
    failedCount: failures.length,
    failures,
  };
}

export async function sendMissedSessionsEmails(): Promise<SendResult> {
  const authorized = await hasWorkflowAccess();
  if (!authorized) {
    return {
      success: false,
      message: 'You are not authorized to perform this action.',
      sentCount: 0,
      failedCount: 0,
    };
  }

  const students = await getStudentsWithMissedSessions();

  if (students.length === 0) {
    return {
      success: false,
      message: 'No students have missed more than 2 sessions with zero points.',
      sentCount: 0,
      failedCount: 0,
    };
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return {
      success: false,
      message: 'Email provider is not configured. Please set the Resend environment variables.',
      sentCount: 0,
      failedCount: 0,
    };
  }

  try {
    return await sendWithResend(students);
  } catch (error) {
    console.error('Workflow email send error', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send reminder emails.',
      sentCount: 0,
      failedCount: students.length,
    };
  }
}

