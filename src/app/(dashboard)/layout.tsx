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
    <div className="flex cursor-pointer items-center gap-2 rounded-xl border border-eco-500/10 bg-white/5 px-2.5 py-1.5 text-stone-200 outline-none transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-500">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={24}
          height={24}
          className="h-6 w-6 rounded-full border border-emerald-500/30 object-cover"
        />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="hidden max-w-[100px] truncate text-xs font-semibold sm:inline">
        {displayName}
      </span>
      <ChevronDown size={14} className="text-stone-400" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-xl bg-emerald-500 px-4 py-2.5 text-white outline-none focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-emerald-500"
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
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-eco-500/10 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpenMobile(true)}
              className="rounded-lg border border-eco-500/10 p-2 text-eco-500 hover:bg-eco-500/10 lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden text-xs font-medium text-stone-500 md:block">
              EcoGuide AI / Dashboard
            </div>
          </div>

          {/* Action modules */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <NotificationDropdown />

            {/* User Profile settings menu */}
            <DropdownMenu trigger={profileTrigger} align="right">
              <div className="border-b border-eco-500/10 px-4 py-2">
                <p className="truncate text-xs font-bold text-white">{displayName}</p>
                <p className="truncate text-[10px] text-stone-500">{user?.email}</p>
              </div>

              <Link
                href="/settings"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-stone-300 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:bg-white/5"
                role="menuitem"
              >
                <User size={14} className="text-stone-400" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/settings"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-stone-300 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:bg-white/5"
                role="menuitem"
              >
                <Settings size={14} className="text-stone-400" />
                <span>Account Settings</span>
              </Link>

              <hr className="my-1 border-eco-500/5" />

              <button
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-red-400 outline-none transition-colors hover:bg-red-500/5 focus-visible:bg-red-500/5"
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
          className="flex-1 overflow-y-auto px-4 py-6 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
