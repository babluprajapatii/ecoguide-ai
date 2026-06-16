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
          className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-dark-900/90 border-r border-eco-500/10 z-40 transition-all duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} flex flex-col justify-between`}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-eco-500/10">
            <Link
              href="/dashboard"
              tabIndex={isCollapsed && !isOpenMobile ? -1 : 0}
              className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
                E
              </div>
              {(!isCollapsed || isOpenMobile) && (
                <span className="font-bold text-lg tracking-tight text-white">
                  EcoGuide <span className="text-gradient">AI</span>
                </span>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg border border-eco-500/10 text-eco-500 hover:bg-eco-500/10 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-3 space-y-1" aria-label="Main Navigation">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  // Suppress tabIndex if collapsed on desktop
                  tabIndex={isCollapsed && !isOpenMobile ? -1 : 0}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 font-medium border-l-2 border-emerald-500'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`transition-colors shrink-0 ${
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
        <div className="p-3 border-t border-eco-500/10 space-y-2">
          {/* User profile capsule */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-sm font-semibold border border-emerald-500/30">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {(!isCollapsed || isOpenMobile) && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={() => void signOut()}
            tabIndex={isCollapsed && !isOpenMobile ? -1 : 0}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-stone-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
