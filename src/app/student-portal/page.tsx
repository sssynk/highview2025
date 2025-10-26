'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout, type Session } from '@/lib/auth';
import { getStudentsWithPoints } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { LogOut, Trophy, Target, Calendar, Award } from 'lucide-react';

interface StudentData {
  student_id: string;
  first_name: string;
  last_name: string;
  company: string;
  total_session_points: number;
  total_extra_points: number;
  total_points: number;
  sessions_attended: number;
  total_sessions: number;
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [leaderboard, setLeaderboard] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentRank, setStudentRank] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sessionData = await getSession();
    setSession(sessionData);

    if (sessionData?.studentId) {
      const students = await getStudentsWithPoints();
      setLeaderboard(students);
      
      // Find the current student's data
      const currentStudent = students.find(s => s.student_id === sessionData.studentId);
      setStudentData(currentStudent || null);
      
      // Find student's rank
      const rank = students.findIndex(s => s.student_id === sessionData.studentId) + 1;
      setStudentRank(rank);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  const getAttendanceRate = () => {
    if (!studentData || studentData.total_sessions === 0) return 0;
    return ((studentData.sessions_attended / studentData.total_sessions) * 100).toFixed(1);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className="h-5 w-5" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">No student data found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please contact an administrator to link your account.
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-4">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="173.202" height="17.94" viewBox="0 0 173.202 17.94" className="h-4 w-auto">
              <g id="Group_8604" data-name="Group 8604" transform="translate(-494.706 -119.476)">
                <path id="Path_9848" data-name="Path 9848" d="M494.706,119.776h2.286v7.745h8.7v-7.745H508v17.381h-2.309v-7.536h-8.7v7.536h-2.286Z" transform="translate(0 -0.02)" fill="#000"></path>
                <path id="Path_9849" data-name="Path 9849" d="M521.731,119.776h2.287v17.381h-2.287Z" transform="translate(-1.801 -0.02)" fill="#000"></path>
                <path id="Path_9850" data-name="Path 9850" d="M541.409,136.752a8.049,8.049,0,0,1-2.707-1.867,8.637,8.637,0,0,1-1.785-2.847,9.753,9.753,0,0,1-.641-3.581,9.9,9.9,0,0,1,.629-3.592,8.565,8.565,0,0,1,1.785-2.847,8.117,8.117,0,0,1,2.707-1.878,8.525,8.525,0,0,1,3.4-.665,7.949,7.949,0,0,1,3.231.63,7.749,7.749,0,0,1,2.426,1.633,6.013,6.013,0,0,1,1.411,2.146l-2.053,1a5,5,0,0,0-1.891-2.4,5.437,5.437,0,0,0-3.125-.887,6.07,6.07,0,0,0-3.231.863,5.94,5.94,0,0,0-2.206,2.4,7.738,7.738,0,0,0-.793,3.592,7.6,7.6,0,0,0,.806,3.57,6.007,6.007,0,0,0,2.216,2.4,6.072,6.072,0,0,0,3.231.863,5.989,5.989,0,0,0,2.859-.677,5.332,5.332,0,0,0,2.029-1.867A5.013,5.013,0,0,0,550.46,130V129.9h-5.668v-1.982h7.977v1.539a8.184,8.184,0,0,1-.629,3.278,7.555,7.555,0,0,1-4.27,4.118,8.407,8.407,0,0,1-3.056.559A8.623,8.623,0,0,1,541.409,136.752Z" transform="translate(-2.771 0)" fill="#000"></path>
                <path id="Path_9851" data-name="Path 9851" d="M565.848,119.776h2.287v7.745h8.7v-7.745h2.31v17.381h-2.31v-7.536h-8.7v7.536h-2.287Z" transform="translate(-4.741 -0.02)" fill="#000"></path>
                <path id="Path_9852" data-name="Path 9852" d="M591.064,119.776h2.449l5.086,14.581,5.063-14.581h2.449l-6.252,17.381h-2.52Z" transform="translate(-6.422 -0.02)" fill="#000"></path>
                <path id="Path_9853" data-name="Path 9853" d="M618.152,119.776h2.286v17.381h-2.286Z" transform="translate(-8.227 -0.02)" fill="#000"></path>
                <path id="Path_9854" data-name="Path 9854" d="M655.93,119.776h2.4l3.8,14.277,3.967-14.277h2.4l3.919,14.232,3.826-14.232h2.4l-4.876,17.381h-2.543l-3.943-14.138-3.944,14.138H660.8Z" transform="translate(-10.745 -0.02)" fill="#000"></path>
                <g id="Group_8603" data-name="Group 8603" transform="translate(624.13 120.913)">
                  <rect id="Rectangle_3852" data-name="Rectangle 3852" width="8.077" height="1.96" transform="translate(3.256 7.099)" fill="#000"></rect>
                  <rect id="Rectangle_3853" data-name="Rectangle 3853" width="11.333" height="1.96" transform="translate(0 14.264)" fill="#000"></rect>
                  <rect id="Rectangle_3854" data-name="Rectangle 3854" width="4.821" height="1.96" transform="translate(6.511)" fill="#000"></rect>
                </g>
              </g>
            </svg>
            <span className="text-sm font-medium">Student Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-65px)] overflow-auto p-8">
        <div className="mx-auto max-w-6xl">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome, {studentData.first_name} {studentData.last_name}!
            </h1>
            <p className="mt-2 text-muted-foreground">{studentData.company}</p>
          </div>

          {/* Personal Stats */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-3">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{studentData.total_points}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Attended</p>
                  <p className="text-2xl font-bold">
                    {studentData.sessions_attended}/{studentData.total_sessions}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-3">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{getAttendanceRate()}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-full bg-yellow-100 p-3`}>
                  <Trophy className={`h-6 w-6 ${getRankColor(studentRank)}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold">#{studentRank}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="mb-8 rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Points Breakdown</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm font-medium">Session Points</span>
                <span className="text-lg font-bold text-blue-600">
                  {studentData.total_session_points}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm font-medium">Extra Points</span>
                <span className="text-lg font-bold text-green-600">
                  {studentData.total_extra_points}
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold">Class Leaderboard</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                See how you rank among your peers
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left font-medium">Rank</th>
                    <th className="p-4 text-left font-medium">Student</th>
                    <th className="p-4 text-left font-medium">Company</th>
                    <th className="p-4 text-center font-medium">Attendance</th>
                    <th className="p-4 text-right font-medium">Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student, index) => {
                    const rank = index + 1;
                    const isCurrentStudent = student.student_id === studentData.student_id;
                    const attendanceRate =
                      student.total_sessions > 0
                        ? ((student.sessions_attended / student.total_sessions) * 100).toFixed(1)
                        : '0';

                    return (
                      <tr
                        key={student.student_id}
                        className={`border-b last:border-0 ${
                          isCurrentStudent ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className={`flex items-center gap-2 font-bold ${getRankColor(rank)}`}>
                            {getRankIcon(rank)}
                            #{rank}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`font-medium ${isCurrentStudent ? 'text-blue-600' : ''}`}>
                            {student.first_name} {student.last_name}
                            {isCurrentStudent && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (You)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{student.company}</td>
                        <td className="p-4 text-center text-sm">
                          <span className="rounded-full bg-muted px-2 py-1">
                            {student.sessions_attended}/{student.total_sessions} ({attendanceRate}%)
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-lg font-bold">{student.total_points}</span>
                          <div className="text-xs text-muted-foreground">
                            {student.total_session_points} + {student.total_extra_points}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

