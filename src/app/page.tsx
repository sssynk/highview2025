'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/actions';
import { Users, Calendar, TrendingUp, Award } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalSessions: number;
  averagePoints: string;
  topStudents: Array<{
    student_id: string;
    first_name: string;
    last_name: string;
    company: string;
    total_points: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalSessions: 0,
    averagePoints: '0',
    topStudents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getDashboardStats();
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to Highview Student Management System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="mt-2 text-3xl font-bold">{stats.totalSessions}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Points</p>
                <p className="mt-2 text-3xl font-bold">{stats.averagePoints}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Performers</p>
                <p className="mt-2 text-3xl font-bold">{stats.topStudents.length}</p>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <Award className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Students Leaderboard */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">Top Performers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Students with the highest total points
            </p>
          </div>
          <div className="p-6">
            {stats.topStudents.length > 0 ? (
              <div className="space-y-4">
                {stats.topStudents.map((student, index) => (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : index === 1
                            ? 'bg-gray-400/20 text-gray-600'
                            : index === 2
                            ? 'bg-orange-500/20 text-orange-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {student.total_points}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No student data available yet.</p>
                <p className="mt-2 text-sm">Add students and sessions to see the leaderboard.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/students"
                className="block rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Manage Students</p>
                    <p className="text-sm text-muted-foreground">
                      Add, import, or view students
                    </p>
                  </div>
                </div>
              </a>
              <a
                href="/sessions"
                className="block rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Manage Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Add sessions and track attendance
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">About</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This system helps Highview track student attendance and engagement across
                sessions.
              </p>
              <ul className="list-inside list-disc space-y-2">
                <li>Track student attendance with points (0, 2.5, or 5)</li>
                <li>Award extra points for additional achievements</li>
                <li>Import students from CSV files</li>
                <li>View comprehensive leaderboards and statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
