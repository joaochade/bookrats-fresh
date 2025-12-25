'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  
  // Don't show nav on auth pages or landing page
  if (pathname.startsWith('/auth') || pathname === '/') {
    return null;
  }
  
  const isActive = (path: string) => {
    if (path === '/groups') {
      return pathname === '/groups' || pathname.startsWith('/groups/');
    }
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === path || pathname.startsWith(path);
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t px-6 py-4 safe-area-bottom z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <Link 
          href="/dashboard"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>

        <Link 
          href="/groups"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/groups') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Users size={24} />
          <span className="text-xs font-medium">Groups</span>
        </Link>
        
        <Link 
          href="/profile"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <User size={24} />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}