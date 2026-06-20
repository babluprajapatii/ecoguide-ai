'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@/features/auth/hooks/useUser';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Zap,
  Users,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (value: boolean) => void;
}

/**
 * Sidebar component handles application-wide navigation.
 *
 * Implements:
 * 1. Responsive collapsible behaviors (desktop toggle + mobile overlay).
 * 2. Keyboard focus tabIndex suppression when collapsed.
 * 3. High-contrast active route highlighting (WCAG color guidelines).
 * 4. Performance isolation using the useUser selector hook.
 */
export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const user = useUser();
  const { signOut } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assessment', path: '/assessment', icon: ClipboardList },
    { name: 'AI Coach', path: '/coach', icon: MessageSquare },
    { name: 'Simulator', path: '/simulator', icon: Zap },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Badges', path: '/badges', icon: Award },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Helper to check if a route is active
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Eco User';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpenMobile && (
        /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
        <div
          className="fixed inset-0 z-40 bg-dark-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 border-r border-eco-500/10 bg-dark-900/90 transition-all duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} flex flex-col justify-between`}
      >
        <div>
          {/* Header Branding */}
          <div className="flex h-16 items-center justify-between border-b border-eco-500/10 px-4">
            <Link
              href="/dashboard"
              tabIndex={isCollapsed && !isOpenMobile ? -1 : 0}
              className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
                E
              </div>
              {(!isCollapsed || isOpenMobile) && (
                <span className="text-lg font-bold tracking-tight text-white">
                  EcoGuide <span className="text-gradient">AI</span>
                </span>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-7 w-7 items-center justify-center rounded-lg border border-eco-500/10 text-eco-500 transition-colors hover:bg-eco-500/10 lg:flex"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-1 p-3" aria-label="Main Navigation">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  // Suppress tabIndex if collapsed on desktop
                  tabIndex={isCollapsed && !isOpenMobile ? -1 : 0}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    active
                      ? 'border-l-2 border-emerald-500 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 font-medium text-emerald-400'
                      : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`shrink-0 transition-colors ${
                      active ? 'text-emerald-400' : 'text-stone-400 group-hover:text-stone-200'
                    }`}
                  />
                  {(!isCollapsed || isOpenMobile) && (
                    <span className="text-sm tracking-wide">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="space-y-2 border-t border-eco-500/10 p-3">
          {/* User profile capsule */}
          <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-white/5 bg-white/5 px-3 py-2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full border border-emerald-500/30 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-sm font-semibold text-emerald-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {(!isCollapsed || isOpenMobile) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-stone-500">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={() => void signOut()}
            tabIndex={isCollapsed && !isOpenMobile ? -1 : 0}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-400 outline-none transition-all duration-200 hover:bg-red-500/5 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Log out of account"
          >
            <LogOut size={20} className="shrink-0" />
            {(!isCollapsed || isOpenMobile) && <span className="text-sm">Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
