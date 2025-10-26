'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import { getStudentsMissingSessions, sendMissedSessionEmails } from '@/lib/workflow';
import { StudentAbsenceSummary } from '@/lib/types';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailWarning,
  RefreshCcw,
  Users,
} from 'lucide-react';

type StatusType = 'success' | 'error' | 'info';

interface StatusMessage {
  type: StatusType;
  text: string;
}

export default function WorkflowPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentAbsenceSummary[]>([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    const sessionData = await getSession();

    if (!sessionData || !['admin', 'professor'].includes(sessionData.role || '')) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    await loadStudents();
    setLoading(false);
  };

  const loadStudents = async () => {
    setRefreshing(true);
    const data = await getStudentsMissingSessions();
    setStudents(data);
    setRefreshing(false);
  };

  const handleSendEmails = async () => {
    setSending(true);
    setStatus(null);
    const result = await sendMissedSessionEmails();

    if (result.success) {
      setStatus({
        type: 'success',
        text: result.message ?? 'Emails sent successfully.',
      });
    } else {
      setStatus({
        type: 'error',
        text:
          result.error ??
          result.message ??
          'Unable to send emails. Please try again or check the logs.',
      });
    }

    await loadStudents();
    setSending(false);
  };

  const recipients = useMemo(
    () => ({
      flagged: students.length,
      withEmail: students.filter((student) => Boolean(student.email)).length,
      missingEmail: students.filter((student) => !student.email).length,
    }),
    [students]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading workflow...
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <p className="text-lg font-semibold text-destructive">
            Access restricted
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This workflow is only available to professors and administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Attendance Workflow</h1>
          <p className="mt-2 text-muted-foreground">
            Identify students who have missed more than two sessions and send a
            personalized check-in email in one click.
          </p>
        </div>

        {status && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-4 text-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status.type === 'error'
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : status.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <MailWarning className="h-4 w-4" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Flagged Students</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{recipients.flagged}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              More than two zero-point sessions
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ready to Email</p>
              <MailWarning className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {recipients.withEmail}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Students with an email on file
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Missing Contact</p>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {recipients.missingEmail}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add emails to include them next time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSendEmails}
            disabled={sending || recipients.withEmail === 0}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending emails...
              </>
            ) : (
              <>
                <MailWarning className="mr-2 h-4 w-4" />
                Send Check-in Email
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={loadStudents}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh list
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Only students with more than two zero-point sessions are included.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Missed Sessions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {students.map((student) => (
                <tr key={student.student_id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {student.student_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {student.company}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {student.email ? (
                      <span className="text-foreground">{student.email}</span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Email missing
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex min-w-[3rem] justify-end rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-700">
                      {student.missed_sessions}
                    </span>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                    Everyone is keeping up! No students currently require an
                    attendance follow-up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
