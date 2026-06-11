'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBadges } from '@/features/gamification/hooks/useBadges';
import {
  Leaf,
  Trophy,
  LayoutDashboard,
  ClipboardCheck,
  TrendingUp,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Award,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Global Navigation Header Component.
 *
 * Renders brand logo, navigation links, mobile hamburger menu,
 * real-time gamification stats (Points and Level), and overlays
 * floating toast notifications for newly earned badges.
 */
export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { level, totalPoints, toasts, dismissToast } = useBadges(user?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu on path change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/assessment', label: 'Assessment', icon: ClipboardCheck },
    { href: '/simulator', label: 'Simulator', icon: TrendingUp },
    { href: '/coach', label: 'AI Coach', icon: MessageSquare },
    { href: '/badges', label: 'Achievements', icon: Trophy },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('[Navigation] Sign out failed:', err);
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary focus:outline-none">
              <Leaf className="h-6 w-6 shrink-0" strokeWidth={2.2} />
              <span className="font-bold text-lg tracking-tight text-foreground">EcoGuide AI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile details & Sign Out */}
          <div className="hidden md:flex items-center gap-4">
            {/* Gamification Indicator */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3.5 py-1.5 text-xs font-semibold">
              <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-muted-foreground">Level:</span>
              <span className="text-foreground">{level.name}</span>
              <span className="text-muted-foreground font-light">|</span>
              <span className="text-primary">{totalPoints} pts</span>
            </div>

            {/* User details */}
            <span className="text-xs text-muted-foreground max-w-[150px] truncate" title={user.email}>
              {user.email}
            </span>

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive"
              aria-label="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Gamification indicator on mobile */}
            <Link
              href="/badges"
              className="flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-bold"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-primary">{totalPoints} pts</span>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-expanded={isOpen}
              aria-label="Toggle main menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 py-4 space-y-3 shadow-lg">
            <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <hr className="border-border" />

            <div className="flex items-center justify-between text-xs text-muted-foreground px-3">
              <span>{user.email}</span>
              <span>Level: {level.name}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Floating Badge Unlock Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" role="none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border border-amber-500/20 bg-card/95 p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500">
              <Award className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                Badge Earned!
              </span>
              <h4 className="text-sm font-bold text-foreground leading-tight mt-0.5">
                {toast.badge.name}
              </h4>
              <p className="text-xs text-muted-foreground leading-snug mt-1">
                {toast.badge.description}
              </p>
              <p className="text-[10px] font-semibold text-emerald-500 mt-1">
                +{toast.badge.pointValue} Points Awarded
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground h-fit p-1 rounded-full hover:bg-muted"
              aria-label={`Dismiss notification for ${toast.badge.name}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
