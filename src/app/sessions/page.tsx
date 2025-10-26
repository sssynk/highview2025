'use client';

import { useEffect, useState } from 'react';
import {
  getSessions,
  getSessionWithAttendance,
  addSession,
  deleteSession,
  updateAttendance,
} from '@/lib/actions';
import { Session, SessionWithAttendance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionWithAttendance | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const data = await getSessions();
    setSessions(data);
    setLoading(false);
  };

  const handleAddSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addSession({
      name: formData.get('name') as string,
      date: formData.get('date') as string,
    });

    if (result.success) {
      setShowAddModal(false);
      loadSessions();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDelete = async (session_id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(session_id);
      if (expandedSession === session_id) {
        setExpandedSession(null);
        setSessionDetails(null);
      }
      loadSessions();
    }
  };

  const handleExpandSession = async (session_id: string) => {
    if (expandedSession === session_id) {
      setExpandedSession(null);
      setSessionDetails(null);
    } else {
      setExpandedSession(session_id);
      setLoadingAttendance(true);
      const details = await getSessionWithAttendance(session_id);
      setSessionDetails(details);
      setLoadingAttendance(false);
    }
  };

  const handleUpdateAttendance = async (
    student_id: string,
    session_id: string,
    points: number
  ) => {
    await updateAttendance(student_id, session_id, points);
    // Reload session details
    const details = await getSessionWithAttendance(session_id);
    setSessionDetails(details);
    loadSessions();
  };

  const getPointsColor = (points: number) => {
    if (points === 0) return 'bg-red-500/10 text-red-600 border-red-500/20';
    if (points === 2.5) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    if (points === 5) return 'bg-green-500/10 text-green-600 border-green-500/20';
    return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sessions</h1>
            <p className="mt-2 text-muted-foreground">
              Manage sessions and track student attendance
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Button>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.session_id} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">{session.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{session.session_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExpandSession(session.session_id)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Attendance
                    {expandedSession === session.session_id ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(session.session_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {expandedSession === session.session_id && (
                <div className="border-t p-4">
                  {loadingAttendance ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Loading attendance...
                    </div>
                  ) : sessionDetails && sessionDetails.attendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="p-3 text-left text-sm font-medium">Student</th>
                            <th className="p-3 text-left text-sm font-medium">Company</th>
                            <th className="p-3 text-center text-sm font-medium">
                              Current Points
                            </th>
                            <th className="p-3 text-center text-sm font-medium">
                              Mark Attendance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionDetails.attendance.map((att) => (
                            <tr key={att.student_id} className="border-b last:border-0">
                              <td className="p-3">
                                <div className="font-medium">{att.student_name}</div>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {att.company}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${getPointsColor(
                                    att.points
                                  )}`}
                                >
                                  {att.points} pts
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant={att.points === 0 ? 'default' : 'outline'}
                                    onClick={() =>
                                      handleUpdateAttendance(
                                        att.student_id,
                                        session.session_id,
                                        0
                                      )
                                    }
                                    className={
                                      att.points === 0
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : ''
                                    }
                                  >
                                    Absent (0)
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={att.points === 2.5 ? 'default' : 'outline'}
                                    onClick={() =>
                                      handleUpdateAttendance(
                                        att.student_id,
                                        session.session_id,
                                        2.5
                                      )
                                    }
                                    className={
                                      att.points === 2.5
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : ''
                                    }
                                  >
                                    Present (2.5)
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={att.points === 5 ? 'default' : 'outline'}
                                    onClick={() =>
                                      handleUpdateAttendance(
                                        att.student_id,
                                        session.session_id,
                                        5
                                      )
                                    }
                                    className={
                                      att.points === 5
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : ''
                                    }
                                  >
                                    Engaged (5)
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No students enrolled yet. Add students to track attendance.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                No sessions yet. Add a session to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Add New Session</h2>
            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Session Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Week 1: Introduction"
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Session</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
