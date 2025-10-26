'use client';

import { useEffect, useState } from 'react';
import { getUsers, updateUserRole, deleteUser, getStudents } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Trash2, Shield, GraduationCap, User, X } from 'lucide-react';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'professor' | 'student' | null;
  student_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at: Date;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  company: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const loadStudents = async () => {
    const data = await getStudents();
    setStudents(data);
  };

  const handleRoleChange = async (userId: number, role: 'admin' | 'professor' | 'student' | null, studentId?: string) => {
    // If assigning student role, show student selector
    if (role === 'student' && !studentId) {
      setSelectedUserId(userId);
      setShowStudentSelector(true);
      return;
    }

    const result = await updateUserRole(userId, role, studentId);
    if (result.success) {
      loadUsers();
      setShowStudentSelector(false);
      setSelectedUserId(null);
    } else if (result.error) {
      alert(result.error);
    }
  };

  const handleDelete = async (userId: number, email: string) => {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      const result = await deleteUser(userId);
      if (result.success) {
        loadUsers();
      }
    }
  };

  const getRoleBadgeStyle = (role: string | null) => {
    if (role === 'admin') return 'bg-red-600 text-white';
    if (role === 'professor') return 'bg-blue-600 text-white';
    if (role === 'student') return 'bg-green-600 text-white';
    return 'bg-gray-400 text-white';
  };

  const getRoleIcon = (role: string | null) => {
    if (role === 'admin') return <Shield className="h-4 w-4" />;
    if (role === 'professor') return <User className="h-4 w-4" />;
    if (role === 'student') return <GraduationCap className="h-4 w-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      {/* Student Selector Modal */}
      {showStudentSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Select Student</h2>
              <button
                onClick={() => {
                  setShowStudentSelector(false);
                  setSelectedUserId(null);
                }}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Choose which student this user account should be connected to:
            </p>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {students.map((student) => (
                  <button
                    key={student.student_id}
                    onClick={() => {
                      if (selectedUserId) {
                        handleRoleChange(selectedUserId, 'student', student.student_id);
                      }
                    }}
                    className="w-full rounded-md border bg-background p-3 text-left hover:bg-muted"
                  >
                    <div className="font-medium">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {student.company} • ID: {student.student_id}
                    </div>
                  </button>
                ))}
                {students.length === 0 && (
                  <div className="rounded-md border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                    No students available. Please add students first.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full overflow-auto p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="mt-2 text-muted-foreground">
              Manage user roles and permissions
            </p>
          </div>

        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium">Email</th>
                  <th className="p-4 text-left font-medium">Current Role</th>
                  <th className="p-4 text-center font-medium">Assign Role</th>
                  <th className="p-4 text-center font-medium">Registered</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                      {user.student_id && user.first_name && (
                        <div className="mt-1 text-xs text-blue-600">
                          → {user.first_name} {user.last_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${getRoleBadgeStyle(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role || 'No Role'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant={user.role === 'admin' ? 'default' : 'outline'}
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          style={
                            user.role === 'admin'
                              ? {
                                  backgroundColor: '#dc2626',
                                  borderColor: '#dc2626',
                                  color: 'white',
                                }
                              : {}
                          }
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.role === 'professor' ? 'default' : 'outline'}
                          onClick={() => handleRoleChange(user.id, 'professor')}
                          style={
                            user.role === 'professor'
                              ? {
                                  backgroundColor: '#2563eb',
                                  borderColor: '#2563eb',
                                  color: 'white',
                                }
                              : {}
                          }
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.role === 'student' ? 'default' : 'outline'}
                          onClick={() => handleRoleChange(user.id, 'student')}
                          style={
                            user.role === 'student'
                              ? {
                                  backgroundColor: '#16a34a',
                                  borderColor: '#16a34a',
                                  color: 'white',
                                }
                              : {}
                          }
                        >
                          <GraduationCap className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleChange(user.id, null)}
                          disabled={!user.role}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user.id, user.email)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-2 font-medium">Role Descriptions:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Admin:</strong> Full access to all features including user management
            </li>
            <li>
              <strong>Professor:</strong> Access to dashboard, sessions, students, and attendance
            </li>
            <li>
              <strong>Student:</strong> Access to student portal only (must be linked to a student record)
            </li>
            <li>
              <strong>No Role:</strong> Cannot log in until assigned a role
            </li>
          </ul>
        </div>
        </div>
      </div>
    </>
  );
}

