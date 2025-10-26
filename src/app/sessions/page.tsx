'use client';

import { useEffect, useState } from 'react';
import {
  getSessions,
  getSessionWithAttendance,
  addSession,
  deleteSession,
  updateAttendance,
  addExtraPoints,
} from '@/lib/actions';
import { Session, SessionWithAttendance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Users, ChevronDown, ChevronUp, Star } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionWithAttendance | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [participationPoints, setParticipationPoints] = useState<{ [key: string]: string }>({});

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

  const handleAddParticipationPoints = async (
    student_id: string,
    session_id: string,
    sessionName: string
  ) => {
    const key = `${student_id}-${session_id}`;
    const points = parseFloat(participationPoints[key] || '0');
    
    if (points <= 0) {
      alert('Please enter a valid point value');
      return;
    }

    const result = await addExtraPoints({
      student_id,
      source: `Participation - ${sessionName}`,
      points,
    });

    if (result.success) {
      // Clear the input
      setParticipationPoints(prev => ({ ...prev, [key]: '' }));
      // Reload to show updated totals
      loadSessions();
    }
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
                    <>
                      {/* Attendance Stats */}
                      <div className="mb-4 rounded-lg bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Attendance Rate
                            </p>
                            <p className="text-2xl font-bold">
                              {(
                                (sessionDetails.attendance.filter(
                                  (a) => Number(a.points) === 5
                                ).length /
                                  sessionDetails.attendance.length) *
                                100
                              ).toFixed(0)}
                              %
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {
                                sessionDetails.attendance.filter(
                                  (a) => Number(a.points) === 5
                                ).length
                              }{' '}
                              / {sessionDetails.attendance.length} attended
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {
                                sessionDetails.attendance.filter(
                                  (a) => Number(a.points) === 2.5
                                ).length
                              }{' '}
                              communicated absence
                            </p>
                          </div>
                        </div>
                      </div>
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
                            <th className="p-3 text-center text-sm font-medium">
                              Participation Points
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
                                  style={{
                                    display: 'inline-block',
                                    borderRadius: '9999px',
                                    border: '1px solid',
                                    padding: '4px 12px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    ...(Number(att.points) === 0
                                      ? {
                                          backgroundColor: '#dc2626',
                                          borderColor: '#dc2626',
                                          color: 'white',
                                        }
                                      : Number(att.points) === 2.5
                                      ? {
                                          backgroundColor: '#eab308',
                                          borderColor: '#eab308',
                                          color: 'white',
                                        }
                                      : Number(att.points) === 5
                                      ? {
                                          backgroundColor: '#16a34a',
                                          borderColor: '#16a34a',
                                          color: 'white',
                                        }
                                      : {
                                          backgroundColor: '#f3f4f6',
                                          borderColor: '#d1d5db',
                                          color: '#374151',
                                        }),
                                  }}
                                >
                                  {att.points} pts
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateAttendance(
                                        att.student_id,
                                        session.session_id,
                                        0
                                      )
                                    }
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      borderRadius: '6px',
                                      border: '1px solid',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      ...(Number(att.points) === 0
                                        ? {
                                            backgroundColor: '#dc2626',
                                            borderColor: '#dc2626',
                                            color: 'white',
                                          }
                                        : {
                                            backgroundColor: 'white',
                                            borderColor: '#d1d5db',
                                            color: '#374151',
                                          }),
                                    }}
                                  >
                                    Absent (0)
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateAttendance(
                                        att.student_id,
                                        session.session_id,
                                        2.5
                                      )
                                    }
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      borderRadius: '6px',
                                      border: '1px solid',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      ...(Number(att.points) === 2.5
                                        ? {
                                            backgroundColor: '#eab308',
                                            borderColor: '#eab308',
                                            color: 'white',
                                          }
                                        : {
                                            backgroundColor: 'white',
                                            borderColor: '#d1d5db',
                                            color: '#374151',
                                          }),
                                    }}
                                  >
                                    Communicated (2.5)
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateAttendance(
                                        att.student_id,
                                        session.session_id,
                                        5
                                      )
                                    }
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      borderRadius: '6px',
                                      border: '1px solid',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      ...(Number(att.points) === 5
                                        ? {
                                            backgroundColor: '#16a34a',
                                            borderColor: '#16a34a',
                                            color: 'white',
                                          }
                                        : {
                                            backgroundColor: 'white',
                                            borderColor: '#d1d5db',
                                            color: '#374151',
                                          }),
                                    }}
                                  >
                                    Attended (5)
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="0"
                                    value={participationPoints[`${att.student_id}-${session.session_id}`] || ''}
                                    onChange={(e) => 
                                      setParticipationPoints(prev => ({
                                        ...prev,
                                        [`${att.student_id}-${session.session_id}`]: e.target.value
                                      }))
                                    }
                                    className="w-20 rounded-md border bg-background px-2 py-1 text-center text-sm"
                                  />
                                  <button
                                    onClick={() =>
                                      handleAddParticipationPoints(
                                        att.student_id,
                                        session.session_id,
                                        session.name
                                      )
                                    }
                                    className="rounded-md border border-purple-600 bg-purple-600 px-2 py-1 text-white hover:bg-purple-700"
                                    title="Add participation points"
                                  >
                                    <Star className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
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
