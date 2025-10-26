'use client';

import { useEffect, useState } from 'react';
import {
  getStudentWithDetails,
  createAttendanceDispute,
  getStudentDisputes,
  setupDatabase,
  getUpcomingSessions,
  getSessionDetails,
  getStudentProgressChart,
  generateGoogleCalendarLink,
} from '@/lib/actions';
import { StudentAttendanceRecord, AttendanceDispute, StudentDetails, Session, SessionWithDetails, ProgressDataPoint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Download, Mail, BookOpen, Link2, FileText, Video, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentPage() {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudentAttendanceRecord | null>(null);
  const [disputes, setDisputes] = useState<AttendanceDispute[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<SessionWithDetails | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  const loadStudentData = async () => {
    setLoading(true);
    const studentId = new URLSearchParams(window.location.search).get('id');
    if (studentId) {
      const data = await getStudentWithDetails(studentId);
      setStudent(data);
      const disputesData = await getStudentDisputes(studentId);
      setDisputes(disputesData);
      
      const upcoming = await getUpcomingSessions();
      setUpcomingSessions(upcoming);
      
      const progress = await getStudentProgressChart(studentId);
      setProgressData(progress);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudentData();
    setupDatabase();
  }, []);

  const handleDisputeClick = (session: StudentAttendanceRecord) => {
    setSelectedSession(session);
    setShowDisputeModal(true);
  };

  const handleViewSessionDetails = async (sessionId: string) => {
    const details = await getSessionDetails(sessionId);
    setSelectedSessionDetails(details);
    setShowSessionDetails(true);
  };

  const handleAddToCalendar = async (session: Session) => {
    const link = await generateGoogleCalendarLink(session);
    window.open(link, '_blank');
  };

  const handleSubmitDispute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!student || !selectedSession) return;

    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;

    const result = await createAttendanceDispute({
      student_id: student.student_id,
      session_id: selectedSession.session_id,
      message,
    });

    if (result.success) {
      setShowDisputeModal(false);
      setSelectedSession(null);
      loadStudentData();
      (e.target as HTMLFormElement).reset();
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
                  formatter={(value: number) => [value.toFixed(1) + ' pts', 'Points']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisputeClick(record)}
                      className="gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Alert
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No attendance records found.</p>
            )}
          </div>
        </div>

        {disputes.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">My Alerts</h2>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{dispute.session_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(dispute.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      dispute.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>
                  {dispute.message && (
                    <p className="text-sm mb-2">{dispute.message}</p>
                  )}
                  {dispute.instructor_response && (
                    <div className="mt-2 p-3 bg-muted rounded">
                      <p className="text-xs font-medium mb-1">Instructor Response:</p>
                      <p className="text-sm">{dispute.instructor_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDisputeModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Alert Instructor</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You are reporting an issue with your attendance for <strong>{selectedSession.session_name}</strong>.
              Please provide details about the inaccuracy.
            </p>
            <form onSubmit={handleSubmitDispute}>
              <textarea
                name="message"
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-md mb-4"
                placeholder="Describe the inaccuracy in your attendance..."
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setSelectedSession(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Alert
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
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
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
