'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import PublicProfileCard from './PublicProfileCard';

export default function LeaderboardClient() {
  const {
    rankings,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    view,
    setView,
    refresh,
  } = useLeaderboard(20);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Focus management: when page changes, focus the first row of the table body
  useEffect(() => {
    if (!isLoading && rankings.length > 0 && tableRef.current) {
      const firstRow = tableRef.current.querySelector('tbody tr') as HTMLElement | null;
      if (firstRow) {
        firstRow.focus();
      }
    }
  }, [page, isLoading, rankings.length]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-red-600 dark:text-red-400 text-center">
        <p className="font-bold">Error loading leaderboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Filter Tablist */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div role="tablist" aria-label="Leaderboard views" className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          {(['global', 'top', 'nearby'] as const).map((viewOption) => (
            <button
              key={viewOption}
              role="tab"
              aria-selected={view === viewOption}
              aria-controls={`panel-${viewOption}`}
              onClick={() => {
                setView(viewOption);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold capitalize rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                view === viewOption
                  ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {viewOption === 'top' ? 'Top 10' : `${viewOption} rankings`}
            </button>
          ))}
        </div>

        <button
          onClick={refresh}
          aria-label="Refresh leaderboard"
          className="p-2 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1-21.22 8h-5.582m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main Leaderboard Rankings Panel */}
      <div id={`panel-${view}`} role="tabpanel" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50 animate-pulse">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
            <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="font-bold text-lg text-zinc-700 dark:text-zinc-300">No participants yet</p>
            <p className="text-sm mt-1">Be the first to join the leaderboard standings!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table ref={tableRef} className="w-full text-left border-collapse">
              <caption className="sr-only">Community Leaderboard Listings and Standings</caption>
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-4 w-24">Rank</th>
                  <th scope="col" className="px-6 py-4">User</th>
                  <th scope="col" className="px-6 py-4 text-right">XP Points</th>
                  <th scope="col" className="px-6 py-4 text-center">Level</th>
                  <th scope="col" className="px-6 py-4 text-center">Badges</th>
                  <th scope="col" className="px-6 py-4 text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {rankings.map((entry) => (
                  <tr
                    key={entry.userId}
                    tabIndex={0}
                    onClick={() => setSelectedUserId(entry.userId)}
                    className={`group cursor-pointer transition-colors focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${
                      entry.isCurrentUser
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 font-medium border-l-4 border-emerald-500'
                        : ''
                    }`}
                  >
                    {/* Rank cell */}
                    <td className="px-6 py-4 font-bold text-sm text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-right">{entry.rank}</span>
                        {/* Rank change indicator */}
                        {entry.rankChange > 0 ? (
                          <span className="text-emerald-500 text-xs flex items-center" aria-label={`Moved up ${entry.rankChange} places`}>
                            ▲{entry.rankChange}
                          </span>
                        ) : entry.rankChange < 0 ? (
                          <span className="text-red-500 text-xs flex items-center" aria-label={`Moved down ${Math.abs(entry.rankChange)} places`}>
                            ▼{Math.abs(entry.rankChange)}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs" aria-label="No change in rank">
                            —
                          </span>
                        )}
                      </div>
                    </td>

                    {/* User display name + avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                          {entry.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                              {entry.displayName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {entry.displayName}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold rounded">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* XP points */}
                    <td className="px-6 py-4 text-right font-black text-sm text-zinc-800 dark:text-zinc-200">
                      {entry.totalPoints.toLocaleString()}
                    </td>

                    {/* Level */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">
                        Lv.{entry.level}
                      </span>
                    </td>

                    {/* Badge Count */}
                    <td className="px-6 py-4 text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
                      {entry.badgeCount} 🏅
                    </td>

                    {/* Active Streak */}
                    <td className="px-6 py-4 text-center text-sm font-bold text-amber-600 dark:text-amber-500">
                      {entry.longestStreak} 🔥
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && view === 'global' && (
        <nav aria-label="Pagination Navigation" className="flex items-center justify-between px-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing Page <span className="font-bold text-zinc-700 dark:text-zinc-300">{page}</span> of{' '}
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{pagination.totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous Page"
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              aria-label="Next Page"
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {/* Selected profile card modal overlay */}
      {selectedUserId && (
        <PublicProfileCard
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
