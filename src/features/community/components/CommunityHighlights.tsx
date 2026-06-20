'use client';

import React from 'react';
import { useCommunityStats } from '../hooks/useCommunityStats';

export default function CommunityHighlights() {
  const { stats, isLoading, error } = useCommunityStats();

  if (error || isLoading || !stats) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  const savers = stats.topCarbonSaver;
  const improved = stats.mostImprovedUser;
  const streak = stats.longestStreakUser;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Top Carbon Saver */}
      <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500/5 via-white to-transparent p-6 transition-all duration-300 hover:shadow-lg dark:border-emerald-900/30 dark:from-emerald-950/10 dark:via-zinc-900 dark:to-zinc-900">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-300 group-hover:bg-emerald-500/20" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Top Carbon Saver
            </h3>
            <p className="text-xs text-zinc-400">Lowest footprint score</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="truncate text-lg font-bold text-zinc-800 dark:text-zinc-100">
            {savers.displayName || 'No data yet'}
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {savers.displayName ? (
              <>
                {savers.value}{' '}
                <span className="text-sm font-semibold text-emerald-600/70">Score</span>
              </>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      {/* Most Improved User */}
      <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-500/5 via-white to-transparent p-6 transition-all duration-300 hover:shadow-lg dark:border-indigo-900/30 dark:from-indigo-950/10 dark:via-zinc-900 dark:to-zinc-900">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-300 group-hover:bg-indigo-500/20" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Most Improved
            </h3>
            <p className="text-xs text-zinc-400">Largest footprint reduction</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="truncate text-lg font-bold text-zinc-800 dark:text-zinc-100">
            {improved.displayName || 'No data yet'}
          </p>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {improved.displayName ? (
              <>
                -{improved.value}{' '}
                <span className="text-sm font-semibold text-indigo-600/70">Points Reduction</span>
              </>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      {/* Longest Streak User */}
      <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-500/5 via-white to-transparent p-6 transition-all duration-300 hover:shadow-lg dark:border-amber-900/30 dark:from-amber-950/10 dark:via-zinc-900 dark:to-zinc-900">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all duration-300 group-hover:bg-amber-500/20" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Streak Champion
            </h3>
            <p className="text-xs text-zinc-400">Active engagement streak</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="truncate text-lg font-bold text-zinc-800 dark:text-zinc-100">
            {streak.displayName || 'No data yet'}
          </p>
          <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {streak.displayName ? (
              <>
                {streak.value} <span className="text-sm font-semibold text-amber-600/70">Days</span>
              </>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
