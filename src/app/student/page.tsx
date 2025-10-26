'use client';

import { useEffect, useState } from 'react';
import {
  getStudentWithDetails,
  createAttendanceDispute,
  getStudentDisputes,
  setupDatabase,
} from '@/lib/actions';
import { StudentAttendanceRecord, AttendanceDispute, StudentDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function StudentPage() {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudentAttendanceRecord | null>(null);
  const [disputes, setDisputes] = useState<AttendanceDispute[]>([]);

  const loadStudentData = async () => {
    setLoading(true);
    const studentId = new URLSearchParams(window.location.search).get('id');
    if (studentId) {
      const data = await getStudentWithDetails(studentId);
      setStudent(data);
      const disputesData = await getStudentDisputes(studentId);
      setDisputes(disputesData);
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
    </div>
  );
}
