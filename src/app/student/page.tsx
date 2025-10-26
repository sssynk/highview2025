'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getStudentWithDetails,
  setupDatabase,
  getUpcomingSessions,
  getSessionDetails,
  getStudentProgressChart,
  generateGoogleCalendarLink,
  getStudentNotes,
  addStudentNote,
  deleteStudentNote,
  getTasksForStudent,
  setTaskCompletion,
} from '@/lib/actions';
import { getSession } from '@/lib/auth';
import { StudentAttendanceRecord, StudentDetails, Session, SessionWithDetails, ProgressDataPoint, StudentNote, StudentSessionTask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Link2, FileText, Video, ExternalLink, Plus, Trash2, StickyNote, ListTodo, CheckCircle2, Circle, Loader2, CalendarDays, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentPage() {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<SessionWithDetails | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [sessionTasks, setSessionTasks] = useState<StudentSessionTask[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  const groupedTasks = useMemo(() => {
    const map = new Map<
      string,
      {
        sessionId: string;
        sessionName: string;
        sessionDate: string;
        tasks: StudentSessionTask[];
      }
    >();

    sessionTasks.forEach((task) => {
      if (!map.has(task.session_id)) {
        map.set(task.session_id, {
          sessionId: task.session_id,
          sessionName: task.session_name,
          sessionDate: task.session_date,
          tasks: [],
        });
      }
      map.get(task.session_id)!.tasks.push(task);
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.sessionDate).getTime();
      const dateB = new Date(b.sessionDate).getTime();
      return dateA - dateB;
    });
  }, [sessionTasks]);

  const loadStudentData = async () => {
    setLoading(true);
    const studentId = new URLSearchParams(window.location.search).get('id');
    if (studentId) {
      const [
        studentDetails,
        upcoming,
        progress,
        notesData,
        tasksData,
      ] = await Promise.all([
        getStudentWithDetails(studentId),
        getUpcomingSessions(),
        getStudentProgressChart(studentId),
        getStudentNotes(studentId),
        getTasksForStudent(studentId),
      ]);

      setStudent(studentDetails);
      setUpcomingSessions(upcoming);
      setProgressData(progress);
      setNotes(notesData);
      setSessionTasks(tasksData);
    } else {
      setStudent(null);
      setUpcomingSessions([]);
      setProgressData([]);
      setNotes([]);
      setSessionTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudentData();
    setupDatabase();
    
    // Check if user is instructor (admin or professor)
    getSession().then(session => {
      setIsInstructor(session?.role === 'admin' || session?.role === 'professor');
    });
  }, []);

  const handleViewSessionDetails = async (sessionId: string) => {
    const details = await getSessionDetails(sessionId);
    setSelectedSessionDetails(details);
    setShowSessionDetails(true);
  };

  const handleAddToCalendar = async (session: Session) => {
    const link = await generateGoogleCalendarLink(session);
    window.open(link, '_blank');
  };

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!student) return;

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    const result = await addStudentNote({
      student_id: student.student_id,
      content,
    });

    if (result.success) {
      setShowAddNoteModal(false);
      loadStudentData();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteStudentNote(noteId);
      loadStudentData();
    }
  };

  const handleToggleTask = async (taskId: number, shouldComplete: boolean) => {
    if (!student) return;
    setUpdatingTaskId(taskId);
    try {
      const result = await setTaskCompletion({
        task_id: taskId,
        student_id: student.student_id,
        completed: shouldComplete,
      });

      if (result.success) {
        const updatedTasks = await getTasksForStudent(student.student_id);
        setSessionTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getPointsBadgeColor = (points: number) => {
    if (points === 5) return 'bg-green-100 text-green-800';
    if (points === 2.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'slide':
        return <FileText className="h-4 w-4" />;
      case 'link':
        return <Link2 className="h-4 w-4" />;
      case 'note':
        return <BookOpen className="h-4 w-4" />;
      case 'recording':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Student not found. Please provide a valid student ID.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{student.first_name} {student.last_name}</h1>
        <p className="text-muted-foreground">{student.company}</p>
      </div>

      <div className="grid gap-6 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-3xl font-bold">{student.total_points}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Session Points</p>
              <p className="text-3xl font-bold">{student.total_session_points}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Extra Points</p>
              <p className="text-3xl font-bold">{student.total_extra_points}</p>
            </div>
          </div>
        </div>

        {progressData.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Progress Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(value || 0);
                    return [numValue.toFixed(1) + ' pts', 'Points'];
                  }}
                  labelFormatter={(label: any) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cumulative_points" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Cumulative Points"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {upcomingSessions.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.session_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCalendar(session)}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Add to Calendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSessionDetails(session.session_id)}
                      className="gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Session Tasks</h2>
          </div>
          {groupedTasks.length > 0 ? (
            <div className="space-y-4">
              {groupedTasks.map((group) => {
                const completedCount = group.tasks.filter((task) => task.completed).length;
                return (
                  <div
                    key={group.sessionId}
                    className="rounded-lg border bg-muted/30 p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="font-medium">{group.sessionName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(group.sessionDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {completedCount} of {group.tasks.length} complete
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 rounded-lg border bg-background p-3 transition-opacity ${
                            task.completed ? 'opacity-75' : ''
                          }`}
                        >
                          <button
                            type="button"
                            aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                            onClick={() => handleToggleTask(task.id, !task.completed)}
                            disabled={updatingTaskId === task.id}
                            className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                              task.completed
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary'
                            } ${updatingTaskId === task.id ? 'opacity-70' : ''}`}
                          >
                            {updatingTaskId === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : task.completed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                task.completed ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {task.due_date && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                                  <CalendarDays className="h-3 w-3" />
                                  Due{' '}
                                  {new Date(task.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                              {task.completed && task.completed_at && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Marked complete{' '}
                                  {new Date(task.completed_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tasks assigned yet. Check back after your instructors add prep or follow-up work.
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance History</h2>
          <div className="space-y-2">
            {student.attendance && student.attendance.length > 0 ? (
              student.attendance.map((record: StudentAttendanceRecord) => (
                <div
                  key={record.session_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.session_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPointsBadgeColor(record.points)}`}>
                      {record.points} pts
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSessionDetails(record.session_id)}
                      className="gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No attendance records found.</p>
            )}
          </div>
        </div>

        {isInstructor && (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Instructor Notes</h2>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddNoteModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>
            <div className="space-y-3">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {new Date(note.created_at || '').toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {note.created_by && ` • ${note.created_by}`}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id!)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes yet. Add a note to track this student's progress.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Instructor Note</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add a note about {student?.first_name}'s progress, behavior, or other observations.
            </p>
            <form onSubmit={handleAddNote}>
              <textarea
                name="content"
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-md mb-4"
                placeholder="Enter your note here..."
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddNoteModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSessionDetails && selectedSessionDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedSessionDetails.name}</h2>
                <p className="text-muted-foreground">
                  {new Date(selectedSessionDetails.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessionDetails(false)}
              >
                Close
              </Button>
            </div>

            {selectedSessionDetails.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedSessionDetails.description}</p>
              </div>
            )}

            {selectedSessionDetails.instructors && selectedSessionDetails.instructors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Instructors</h3>
                <div className="space-y-2">
                  {selectedSessionDetails.instructors.map((instructor) => (
                    <div key={instructor.instructor_id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{instructor.first_name} {instructor.last_name}</p>
                        <a 
                          href={`mailto:${instructor.email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {instructor.email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSessionDetails.resources && selectedSessionDetails.resources.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Resources</h3>
                <div className="space-y-2">
                  {selectedSessionDetails.resources.map((resource) => (
                    <div key={resource.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{resource.title}</p>
                        {resource.content && (
                          <p className="text-sm text-muted-foreground">{resource.content}</p>
                        )}
                      </div>
                      {resource.url && (
                        <a 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
