import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('highview_session');
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If not logged in and trying to access protected route
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login/signup
  if (session && isPublicRoute) {
    const sessionData = JSON.parse(session.value);
    
    // Redirect students to their portal
    if (sessionData.role === 'student') {
      return NextResponse.redirect(new URL('/student-portal', request.url));
    }
    
    // Others go to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-based access control
  if (session && !isPublicRoute) {
    try {
      const sessionData = JSON.parse(session.value);
      
      // Admin routes
      if (pathname.startsWith('/admin')) {
        if (sessionData.role !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // Student portal - only students
      if (pathname.startsWith('/student-portal')) {
        if (sessionData.role !== 'student') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // Dashboard, sessions, students - accessible by admin and professor
      const restrictedRoutes = ['/', '/sessions', '/students', '/workflow'];
      if (restrictedRoutes.includes(pathname)) {
        if (sessionData.role === 'student') {
          return NextResponse.redirect(new URL('/student-portal', request.url));
        }
        if (!sessionData.role || (sessionData.role !== 'admin' && sessionData.role !== 'professor')) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    } catch (error) {
      // Invalid session, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

