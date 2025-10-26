"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Calendar, Users, Shield, LogOut, Workflow } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession, logout, type Session } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const sessionData = await getSession();
    setSession(sessionData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  // Navigation based on role
  const getNavigation = () => {
    if (!session?.role) return [];

    const baseNav = [
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Sessions", href: "/sessions", icon: Calendar },
      { name: "Students", href: "/students", icon: Users },
      { name: "Workflow", href: "/workflow", icon: Workflow },
    ];

    if (session.role === 'admin') {
      return [
        ...baseNav,
        { name: "User Management", href: "/admin", icon: Shield },
      ];
    }

    if (session.role === 'professor') {
      return baseNav;
    }

    return []; // Students have no sidebar nav
  };

  const navigation = getNavigation();

  if (loading) {
    return (
      <div className="flex h-screen w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center justify-center border-b">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Student portal has no sidebar
  if (session?.role === 'student') {
    return null;
  }

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-600 text-white',
      professor: 'bg-blue-600 text-white',
      student: 'bg-green-600 text-white',
    };
    return styles[role as keyof typeof styles] || 'bg-gray-500 text-white';
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* User Profile */}
      <div className="border-b p-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{session ? getInitials(session.email) : 'U'}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-sm font-medium">{session?.email}</p>
            {session?.role && (
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadge(session.role)}`}>
                {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
