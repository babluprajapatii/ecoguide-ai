'use client';

import { useState } from 'react';
import Sidebar from '@/shared/components/Sidebar';
import ThemeToggle from '@/shared/components/ThemeToggle';
import NotificationDropdown from '@/shared/components/NotificationDropdown';
import DropdownMenu from '@/shared/components/DropdownMenu';
import { useUser } from '@/features/auth/hooks/useUser';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Menu, Settings, LogOut, ChevronDown, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface LayoutProps {
  readonly children: React.ReactNode;
}

/**
 * Route group layout for dashboard paths.
 *
 * Implements a collapsible SaaS application shell:
 * 1. Skip to Content accessibility link as the first focusable child.
 * 2. Sidebar container (collapsible on desktop, drawer overlay on mobile).
 * 3. Top Header navigation bar with Hamburger button, Notification dropdown,
 *    Theme switch, and Profile settings menu.
 * 4. Main content scroll container with focus landing id.
 */
export default function DashboardRouteGroupLayout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const user = useUser();
  const { signOut } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Eco User';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const profileTrigger = (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-eco-500/10 bg-white/5 hover:bg-white/10 transition-all text-stone-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover border border-emerald-500/30"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-xs font-semibold hidden sm:inline truncate max-w-[100px]">
        {displayName}
      </span>
      <ChevronDown size={14} className="text-stone-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-500 text-white px-4 py-2.5 rounded-xl z-[100] outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Skip to main content
      </a>

      {/* Sidebar navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Grid Content wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-eco-500/10 bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpenMobile(true)}
              className="lg:hidden p-2 rounded-lg border border-eco-500/10 text-eco-500 hover:bg-eco-500/10"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div className="text-xs font-medium text-stone-500 hidden md:block">
              EcoGuide AI / Dashboard
            </div>
          </div>

          {/* Action modules */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <NotificationDropdown />

            {/* User Profile settings menu */}
            <DropdownMenu trigger={profileTrigger} align="right">
              <div className="px-4 py-2 border-b border-eco-500/10">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
              </div>

              <Link
                href="/settings"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-colors outline-none focus-visible:bg-white/5"
                role="menuitem"
              >
                <User size={14} className="text-stone-400" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/settings"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-colors outline-none focus-visible:bg-white/5"
                role="menuitem"
              >
                <Settings size={14} className="text-stone-400" />
                <span>Account Settings</span>
              </Link>

              <hr className="border-eco-500/5 my-1" />

              <button
                onClick={() => void signOut()}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/5 transition-colors text-left outline-none focus-visible:bg-red-500/5"
                role="menuitem"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </DropdownMenu>
          </div>
        </header>

        {/* Scroll Content wraps */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-6 sm:p-6 lg:p-8 outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
