'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Globe, Lock } from 'lucide-react';
import Image from 'next/image';

interface LeaderboardUser {
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly score: number;
  readonly rank: number;
  readonly isCurrentUser: boolean;
}

interface CommunityPreviewData {
  readonly optedIn: boolean;
  readonly currentUserRank: number | null;
  readonly totalOptedInUsers: number;
  readonly leaderboardPreview: readonly LeaderboardUser[];
}

export function CommunityPreview() {
  const [data, setData] = useState<CommunityPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/community/preview');
      if (!res.ok) {
        throw new Error('Failed to load community preview');
      }
      const previewData = await res.json() as CommunityPreviewData;
      setData(previewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching preview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  const handleToggleOptIn = async (status: boolean) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/community/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opt_in: status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update opt-in preference');
      }

      await fetchPreview();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 animate-pulse h-[300px]" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 flex items-center justify-center text-xs text-muted-foreground">
        Failed to fetch community standings.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-card/25 space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Users size={16} className="text-emerald-500" />
          <span>Community Standings</span>
        </h3>
        {data.optedIn && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleToggleOptIn(false)}
            className="text-[10px] font-bold text-muted-foreground hover:text-red-500 hover:underline disabled:opacity-50"
          >
            Leave Leaderboard
          </button>
        )}
      </div>

      {!data.optedIn ? (
        // Opt-in privacy state
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 dark:bg-emerald-500/20">
            <Lock size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">Join the Eco Leaderboard</h4>
            <p className="max-w-[280px] text-[10px] leading-relaxed text-muted-foreground">
              Compare your Carbon Score with the EcoGuide community. Ranks are entirely anonymous by default; only display names are shown.
            </p>
          </div>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => void handleToggleOptIn(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
          >
            {isUpdating ? 'Opting In...' : 'Opt-In to Leaderboard'}
          </button>
        </div>
      ) : (
        // Ranked leaderboard view
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold bg-muted/20 border border-border/20 rounded-xl p-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Globe size={13} />
              <span>Current Standing:</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              Rank #{data.currentUserRank ?? '-'} of {data.totalOptedInUsers}
            </span>
          </div>

          {/* Leaderboard preview table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="grid" aria-label="Nearby users leaderboard list">
              <thead>
                <tr className="border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th scope="col" className="pb-2 pl-2">Rank</th>
                  <th scope="col" className="pb-2">User</th>
                  <th scope="col" className="pb-2 pr-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {data.leaderboardPreview.map((item, index) => (
                  <tr
                    key={index}
                    className={`text-xs transition-colors ${
                      item.isCurrentUser
                        ? 'bg-emerald-500/5 font-bold text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground hover:bg-muted/10'
                    }`}
                  >
                    <td className="py-2.5 pl-2 font-bold w-12">#{item.rank}</td>
                    <td className="py-2.5 flex items-center gap-2">
                      {item.avatarUrl ? (
                        <Image
                          src={item.avatarUrl}
                          alt={item.displayName}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover border border-border/40"
                        />
                      ) : (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border ${
                          item.isCurrentUser ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-muted border-border/40'
                        }`}>
                          {item.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate max-w-[120px]">{item.displayName}</span>
                      {item.isCurrentUser && (
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          you
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-2 text-right font-medium">
                      {(item.score / 1000).toFixed(1)}t CO₂
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
