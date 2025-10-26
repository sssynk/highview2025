import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getStudentsWithMissedSessions } from '@/lib/workflow';
import WorkflowClient from './workflow-client';

export default async function WorkflowPage() {
  const access = await requireRole(['admin', 'professor']);

  if (!access.authorized) {
    redirect('/');
  }

  const students = await getStudentsWithMissedSessions();

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Workflow</h1>
          <p className="text-muted-foreground">
            Identify students who have missed more than two sessions and send reminder emails in one click.
          </p>
        </div>

        <WorkflowClient initialStudents={students} />
      </div>
    </div>
  );
}

