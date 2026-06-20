'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useCommunitySettings } from '@/features/community/hooks/useCommunitySettings';

const CommunityStatsBar = dynamic(
  () => import('@/features/community/components/CommunityStatsBar'),
  {
    loading: () => (
      <div className="h-24 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    ),
    ssr: false,
  },
);

const CommunityHighlights = dynamic(
  () => import('@/features/community/components/CommunityHighlights'),
  {
    loading: () => (
      <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-36 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-36 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-36 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    ),
    ssr: false,
  },
);

const LeaderboardClient = dynamic(
  () => import('@/features/community/components/LeaderboardClient'),
  {
    loading: () => (
      <div className="h-96 w-full animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
    ),
    ssr: false,
  },
);

const CommunitySettingsPanel = dynamic(
  () => import('@/features/community/components/CommunitySettingsPanel'),
  {
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
    ),
    ssr: false,
  },
);

export default function CommunityPage() {
  const { settings, isLoading, updateSettings } = useCommunitySettings();
  const [isTogglingOptIn, setIsTogglingOptIn] = useState(false);

  const handleJoinCommunity = async () => {
    setIsTogglingOptIn(true);
    try {
      await updateSettings({
        optIn: true,
        leaderboardOptIn: true,
        publicProfileVisibility: 'public',
        bio: '',
      });
    } catch (err) {
      console.error('Failed to join community:', err);
    } finally {
      setIsTogglingOptIn(false);
    }
  };

  const isOptedIn = settings?.optIn === true;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Headings */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Eco Community Standings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track community-wide stats, view global sustainability rankings, and showcase your
            achievements.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-24 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-96 w-full rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ) : !isOptedIn ? (
        /* Opt-In Splash Screen */
        <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 py-16 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Join the EcoGuide Community
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Enable community settings to participate in the leaderboard rankings, show off badges,
            and track collective metrics.
          </p>

          <button
            onClick={handleJoinCommunity}
            disabled={isTogglingOptIn}
            className="mt-8 w-full rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-md transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-auto"
          >
            {isTogglingOptIn ? 'Joining Community...' : 'Join Community'}
          </button>
        </div>
      ) : (
        /* Full Community Dashboard Layout */
        <div className="space-y-8">
          {/* Stats Bar */}
          <CommunityStatsBar />

          {/* Highlights Grid */}
          <CommunityHighlights />

          {/* Leaderboard table and Settings Side panel */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LeaderboardClient />
            </div>
            <div>
              <CommunitySettingsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
