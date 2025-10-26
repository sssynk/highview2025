'use client';

import { useEffect, useState } from 'react';
import {
  getStudentsWithPoints,
  addStudent,
  importStudents,
  deleteStudent,
  setupDatabase,
  addExtraPoints,
  getExtraPointsForStudent,
  deleteExtraPoints,
} from '@/lib/actions';
import { StudentWithPoints, ExtraPoints } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Trash2, Award, Mail } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExtraPointsModal, setShowExtraPointsModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPoints | null>(null);
  const [extraPoints, setExtraPoints] = useState<ExtraPoints[]>([]);

  useEffect(() => {
    loadStudents();
    setupDatabase();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    const data = await getStudentsWithPoints();
    setStudents(data);
    setLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addStudent({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      company: formData.get('company') as string,
    });

    if (result.success) {
      setShowAddModal(false);
      loadStudents();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());
    const studentsData = [];

    for (let i = 1; i < lines.length; i++) {
      const [first_name, last_name, company] = lines[i].split(',').map((s) => s.trim());
      if (first_name && last_name && company) {
        studentsData.push({ first_name, last_name, company });
      }
    }

    const result = await importStudents(studentsData);
    if (result.success) {
      setShowImportModal(false);
      loadStudents();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDelete = async (student_id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await deleteStudent(student_id);
      loadStudents();
    }
  };

  const handleShowExtraPoints = async (student: StudentWithPoints) => {
    setSelectedStudent(student);
    const points = await getExtraPointsForStudent(student.student_id);
    setExtraPoints(points);
    setShowExtraPointsModal(true);
  };

  const handleShowFollowUp = (student: StudentWithPoints) => {
    setSelectedStudent(student);
    setShowFollowUpModal(true);
  };

  const handleAddFollowUpPoints = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const formData = new FormData(e.currentTarget);
    const points = parseFloat(formData.get('points') as string);
    
    const result = await addExtraPoints({
      student_id: selectedStudent.student_id,
      source: 'Follow-up Email',
      points: points,
    });

    if (result.success) {
      setShowFollowUpModal(false);
      loadStudents();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleAddExtraPoints = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const formData = new FormData(e.currentTarget);
    const result = await addExtraPoints({
      student_id: selectedStudent.student_id,
      source: formData.get('source') as string,
      points: parseFloat(formData.get('points') as string),
    });

    if (result.success) {
      const points = await getExtraPointsForStudent(selectedStudent.student_id);
      setExtraPoints(points);
      loadStudents();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteExtraPoints = async (id: number) => {
    if (confirm('Are you sure you want to delete these extra points?')) {
      await deleteExtraPoints(id);
      if (selectedStudent) {
        const points = await getExtraPointsForStudent(selectedStudent.student_id);
        setExtraPoints(points);
      }
      loadStudents();
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
      <h1 className="text-3xl font-bold">Students</h1>
      <p className="mt-2 text-muted-foreground">
              Manage students and track their progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowImportModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Company</th>
                  <th className="p-4 text-center font-medium">Session Points</th>
                  <th className="p-4 text-center font-medium">Extra Points</th>
                  <th className="p-4 text-center font-medium">Total Points</th>
                  <th className="p-4 text-center font-medium">Attendance</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id} className="border-b last:border-0">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student.student_id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{student.company}</td>
                    <td className="p-4 text-center">{student.total_session_points}</td>
                    <td className="p-4 text-center">{student.total_extra_points}</td>
                    <td className="p-4 text-center">
                      <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                        {student.total_points}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {student.sessions_attended} / {student.total_sessions}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowFollowUp(student)}
                          title="Follow-up Points"
                        >
                          <Mail className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowExtraPoints(student)}
                          title="Extra Points"
                        >
                          <Award className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(student.student_id)}
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No students yet. Add or import students to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Company</label>
                <input
                  type="text"
                  name="company"
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
                <Button type="submit">Add Student</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Import Students from CSV</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              CSV format: first_name, last_name, company (with header row)
            </p>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">CSV File</label>
                <input
                  type="file"
                  name="file"
                  accept=".csv"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Import</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Points Modal */}
      {showExtraPointsModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">
              Extra Points for {selectedStudent.first_name} {selectedStudent.last_name}
            </h2>
            
            <form onSubmit={handleAddExtraPoints} className="mb-6 space-y-4 rounded-lg border p-4">
              <h3 className="font-medium">Add Extra Points</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Source</label>
                  <input
                    type="text"
                    name="source"
                    required
                    placeholder="e.g., Bonus project, Quiz"
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Points</label>
                  <input
                    type="number"
                    name="points"
                    step="0.5"
                    required
                    className="w-full rounded-md border bg-background px-3 py-2"
                  />
                </div>
              </div>
              <Button type="submit" size="sm">Add Points</Button>
            </form>

            <div className="mb-4 max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-2 text-left text-sm font-medium">Source</th>
                    <th className="p-2 text-center text-sm font-medium">Points</th>
                    <th className="p-2 text-center text-sm font-medium">Date</th>
                    <th className="p-2 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {extraPoints.map((ep) => (
                    <tr key={ep.id} className="border-b last:border-0">
                      <td className="p-2 text-sm">{ep.source}</td>
                      <td className="p-2 text-center text-sm">{ep.points}</td>
                      <td className="p-2 text-center text-sm">
                        {ep.created_at ? new Date(ep.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExtraPoints(ep.id!)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {extraPoints.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-sm text-muted-foreground">
                        No extra points yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowExtraPointsModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-Up Points Modal */}
      {showFollowUpModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">
              Award Follow-Up Points
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Award points to {selectedStudent.first_name} {selectedStudent.last_name} for completing a follow-up email.
            </p>
            
            <form onSubmit={handleAddFollowUpPoints} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Points</label>
                <input
                  type="number"
                  name="points"
                  step="0.5"
                  min="0"
                  defaultValue="5"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Default: 5 points per follow-up email
                </p>
              </div>
              
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm">
                  <strong>Student:</strong> {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                <p className="text-sm">
                  <strong>Company:</strong> {selectedStudent.company}
                </p>
                <p className="text-sm">
                  <strong>Current Total:</strong> {selectedStudent.total_points} points
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFollowUpModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Mail className="mr-2 h-4 w-4" />
                  Award Points
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
