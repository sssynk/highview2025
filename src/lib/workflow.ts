'use server';

import { Resend } from 'resend';
import { query } from './db';
import { StudentAbsenceSummary } from './types';

const ABSENCE_THRESHOLD = 2;

export async function getStudentsMissingSessions(
  threshold: number = ABSENCE_THRESHOLD
): Promise<StudentAbsenceSummary[]> {
  try {
    const result = await query(
      `
        SELECT
          s.student_id,
          s.first_name,
          s.last_name,
          s.company,
          u.email,
          COUNT(sa.session_id) FILTER (WHERE sa.points = 0) AS missed_sessions,
          COUNT(sa.session_id) AS total_sessions
        FROM students s
        LEFT JOIN session_attendance sa ON sa.student_id = s.student_id
        LEFT JOIN users u
          ON u.student_id = s.student_id
         AND u.role = 'student'
        GROUP BY
          s.student_id,
          s.first_name,
          s.last_name,
          s.company,
          u.email
        HAVING COUNT(sa.session_id) FILTER (WHERE sa.points = 0) > $1
        ORDER BY
          missed_sessions DESC,
          s.last_name,
          s.first_name
      `,
      [threshold]
    );

    return result.rows.map((row) => ({
      student_id: row.student_id,
      first_name: row.first_name,
      last_name: row.last_name,
      company: row.company,
      email: row.email ?? null,
      missed_sessions: Number(row.missed_sessions ?? 0),
      total_sessions: Number(row.total_sessions ?? 0),
    }));
  } catch (error) {
    console.error('Error fetching students with missed sessions:', error);
    return [];
  }
}

export async function sendMissedSessionEmails() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey) {
    return {
      success: false as const,
      error: 'RESEND_API_KEY is not configured. Please add it to your environment settings.',
    };
  }

  if (!fromEmail) {
    return {
      success: false as const,
      error: 'RESEND_FROM_EMAIL is not configured. Please add it to your environment settings.',
    };
  }

  const students = await getStudentsMissingSessions();

  if (students.length === 0) {
    return {
      success: false as const,
      error: 'No students have missed more than two sessions.',
      skipped: 0,
      attempted: 0,
      sent: 0,
      failures: 0,
    };
  }

  const resend = new Resend(resendApiKey);
  const resolvedFrom =
    fromEmail.includes('<') && fromEmail.includes('>') ? fromEmail : `Highview Program <${fromEmail}>`;

  let sent = 0;
  let failures = 0;
  let skipped = 0;

  for (const student of students) {
    if (!student.email) {
      skipped += 1;
      continue;
    }

    const subject = 'We Missed You at Recent Highview Sessions';
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6;">
        <p>Hi ${student.first_name},</p>
        <p>
          We noticed you have missed ${student.missed_sessions} of our recent sessions.
          These sessions are designed to keep you on track with the program, and we want to make sure you have
          everything you need to stay engaged.
        </p>
        <p>
          Please reach out if there is anything we can do to help you catch up or if you are facing any challenges.
          We are here to support you.
        </p>
        <p style="margin-top: 24px;">
          Warmly,<br />
          The Highview Team
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: resolvedFrom,
        to: student.email,
        subject,
        html,
        text: `Hi ${student.first_name},\n\nWe noticed you have missed ${student.missed_sessions} of our recent sessions. Please let us know how we can help you re-engage with the program.\n\nWarmly,\nThe Highview Team`,
      });
      sent += 1;
    } catch (error) {
      failures += 1;
      console.error(`Failed to send email to ${student.email}:`, error);
    }
  }

  return {
    success: failures === 0,
    sent,
    skipped,
    failures,
    attempted: students.length - skipped,
    totalFlagged: students.length,
    message:
      failures === 0
        ? `Successfully sent ${sent} ${sent === 1 ? 'email' : 'emails'} to students with repeated absences.`
        : `Sent ${sent} emails, ${failures} failed. Check logs for details.`,
  };
}

