'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  getStudentsWithMissedSessions,
  sendMissedSessionsEmails,
  type AtRiskStudent,
} from '@/lib/workflow';

type StatusType = 'success' | 'warning' | 'error';

interface StatusMessage {
  type: StatusType;
  title: string;
  message: string;
  failures?: Array<{ email: string; error: string }>;
}

interface WorkflowClientProps {
  initialStudents: AtRiskStudent[];
}

export default function WorkflowClient({ initialStudents }: WorkflowClientProps) {
  const [students, setStudents] = useState<AtRiskStudent[]>(initialStudents);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const refreshStudents = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const latest = await getStudentsWithMissedSessions();
      setStudents(latest);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to refresh student list right now.';
      setStatus({
        type: 'error',
        title: 'Refresh failed',
        message,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleSendEmails = useCallback(async () => {
    setIsSending(true);
    setStatus(null);

    try {
      const result = await sendMissedSessionsEmails();

      const type: StatusType = result.success
        ? 'success'
        : result.sentCount > 0 && result.failedCount > 0
          ? 'warning'
          : 'error';

      setStatus({
        type,
        title: result.success
          ? 'Reminder emails sent'
          : type === 'warning'
            ? 'Partial success'
            : 'Unable to send emails',
        message: result.message,
        failures: result.failures,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while sending emails.';
      setStatus({
        type: 'error',
        title: 'Unexpected error',
        message,
      });
    } finally {
      setIsSending(false);
      await refreshStudents();
    }
  }, [refreshStudents]);

  const statusStyles = useMemo(() => {
    if (!status) return '';

    if (status.type === 'success') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status.type === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    return 'border-destructive/40 bg-destructive/10 text-destructive';
  }, [status]);

  const StatusIcon = useMemo(() => {
    if (!status) return null;

    if (status.type === 'success') {
      return <CheckCircle2 className="h-5 w-5" />;
    }

    return <AlertCircle className="h-5 w-5" />;
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Attendance outreach</h2>
            <p className="text-sm text-muted-foreground">
              Send a reminder email to students with more than two zero-point sessions.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={refreshStudents}
              variant="outline"
              disabled={isRefreshing}
            >
              {isRefreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh list
            </Button>
            <Button
              onClick={handleSendEmails}
              disabled={isSending || students.length === 0}
              className="sm:min-w-[200px]"
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send reminder emails
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          {students.length > 0 ? (
            <p>
              {students.length} student{students.length === 1 ? '' : 's'} currently meet the criteria.
              They will each receive an individual reminder email.
            </p>
          ) : (
            <p>
              Great news! No students have missed more than two sessions with zero points right now.
            </p>
          )}
        </div>

        {status && (
          <div className={`mt-4 flex gap-3 rounded-md border p-4 text-sm ${statusStyles}`}>
            <div className="mt-0.5">
              {StatusIcon}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{status.title}</p>
              <p>{status.message}</p>
              {status.failures && status.failures.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium">Failed deliveries</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {status.failures.map((failure) => (
                      <li key={failure.email}>
                        <span className="font-medium">{failure.email}:</span> {failure.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold">Students needing follow-up</h3>
        </div>

        {students.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Everyone is on track. Check back after future sessions.
          </div>
        ) : (
          <div className="divide-y">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="grid gap-2 p-4 text-sm md:grid-cols-[2fr_2fr_1fr] md:items-center"
              >
                <div>
                  <p className="font-medium">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-muted-foreground">ID: {student.student_id}</p>
                </div>
                <div>
                  <p className="font-medium">{student.email}</p>
                  <p className="text-muted-foreground">Email on file</p>
                </div>
                <div className="md:text-right">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {student.missed_sessions} missed
                    {student.missed_sessions === 1 ? ' session' : ' sessions'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

