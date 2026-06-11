'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBadges } from '@/features/gamification/hooks/useBadges';
import { BadgeGrid } from '@/features/gamification/components/BadgeGrid';
import { Trophy, Award, Sparkles, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Achievements Page — Client Component.
 *
 * Renders the user's gamification points, current level, progress bar,
 * and the complete grid of 10 achievements (earned & unearned).
 */
export default function BadgesPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    allBadges,
    earnedSlugs,
    earnedBadges,
    isLoading: badgesLoading,
    level,
    totalPoints,
  } = useBadges(user?.id ?? null);

  const earnedBadgeMap = useMemo(() => {
    return new Map(earnedBadges.map((b) => [b.badgeSlug, b.earnedAt]));
  }, [earnedBadges]);

  const isLoading = authLoading || badgesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading achievements...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Sign in to view achievements</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Track your points, level up, and unlock achievements as you reduce your carbon footprint.
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In
        </a>
      </div>
    );
  }

  const nextLevelPoints = level.maxPoints;
  const pointsToNext = nextLevelPoints !== null ? nextLevelPoints - totalPoints : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Achievements
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Earn points and badges by completing tasks and adopting eco-friendly habits.
        </p>
      </header>

      {/* Level Summary Card */}
      <section className="mb-10 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 md:p-8 shadow-sm">
        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          {/* Level Badge Column */}
          <div className="flex items-center gap-4 border-border md:border-r md:pr-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-10 w-10" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Level
              </p>
              <h2 className="text-2xl font-bold text-foreground">{level.name}</h2>
              <p className="text-xs text-muted-foreground">Rank #{level.rank}</p>
            </div>
          </div>

          {/* Points Column */}
          <div className="flex flex-col justify-center border-border md:border-r md:px-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground">{totalPoints}</span>
              <span className="text-sm font-semibold text-muted-foreground">Total Points</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-500">
              <Sparkles size={12} />
              {earnedSlugs.size} of {allBadges.length} Badges Earned
            </p>
          </div>

          {/* Progress Column */}
          <div className="flex flex-col justify-center md:pl-6">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Level Progress</span>
              <span className="text-foreground">{(level.progress * 100).toFixed(0)}%</span>
            </div>
            {/* Progress bar container */}
            <div className="mt-2 h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${level.progress * 100}%` }}
                role="progressbar"
                aria-valuenow={Math.round(level.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Level progress"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {nextLevelPoints !== null ? (
                <>
                  Need <span className="font-semibold text-foreground">{pointsToNext}</span> more points
                  to reach next level
                </>
              ) : (
                'You have reached the maximum level! Carbon Champion!'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Grid Header */}
      <h3 className="mb-4 text-lg font-bold text-foreground">Badge Collection</h3>

      {/* Badge Grid Component */}
      <BadgeGrid
        badges={allBadges}
        earnedSlugs={earnedSlugs}
        earnedBadgeMap={earnedBadgeMap}
      />
    </div>
  );
}
