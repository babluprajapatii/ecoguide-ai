'use client';

import React, { useState } from 'react';
import CommunityStatsBar from '@/features/community/components/CommunityStatsBar';
import CommunityHighlights from '@/features/community/components/CommunityHighlights';
import LeaderboardClient from '@/features/community/components/LeaderboardClient';
import CommunitySettingsPanel from '@/features/community/components/CommunitySettingsPanel';
import { useCommunitySettings } from '@/features/community/hooks/useCommunitySettings';

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Headings */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Eco Community Standings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track community-wide stats, view global sustainability rankings, and showcase your achievements.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-24 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-36 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-36 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-36 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          </div>
          <div className="h-96 w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      ) : !isOptedIn ? (
        /* Opt-In Splash Screen */
        <div className="max-w-xl mx-auto text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-2xl mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Join the EcoGuide Community
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Enable community settings to participate in the leaderboard rankings, show off badges, and track collective metrics.
          </p>

          <button
            onClick={handleJoinCommunity}
            disabled={isTogglingOptIn}
            className="mt-8 w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
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
