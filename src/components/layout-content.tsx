'use client';

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar on login/signup pages
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  if (isPublicRoute) {
    return <main className="h-screen overflow-y-auto">{children}</main>;
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/40">
        {children}
      </main>
    </div>
  );
}

