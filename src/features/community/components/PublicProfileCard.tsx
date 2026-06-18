'use client';

import { useEffect, useState } from 'react';
import type { PublicProfile } from '../types/community.types';
import { BADGE_MAP } from '@/features/gamification/data/badges';
import type { BadgeSlug } from '@/features/gamification/types/gamification.types';

interface PublicProfileCardProps {
  userId: string;
  onClose?: () => void;
}

export default function PublicProfileCard({ userId, onClose }: PublicProfileCardProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/community/profile/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This user profile is private or does not exist.');
          }
          throw new Error('Failed to load user profile.');
        }
        const data = await res.json();
        if (active) {
          setProfile(data);
        }
      } catch (err: unknown) {
        if (active) {
          const errMsg = err instanceof Error ? err.message : 'An error occurred.';
          setError(errMsg);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  // Handle click outside modal content to close it
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative transition-transform transform scale-100">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close profile details"
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="w-full pt-4 space-y-2">
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ) : error || !profile ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v.01M20.52 17.525L13.8 6.32a2 2 0 00-3.6 0L3.48 17.525A2 2 0 005.28 20.5h13.44a2 2 0 001.8-2.975z" />
              </svg>
            </div>
            <h3 id="profile-title" className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Profile Unavailable
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {error || 'This user profile is private or does not exist.'}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Close Window
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Header Banner */}
            <div className="h-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-sky-500/10" />

            <div className="px-6 pb-6 relative flex flex-col items-center text-center">
              
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden -mt-10 shadow-lg">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.displayName}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">
                    {profile.displayName.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Title & Level */}
              <h2 id="profile-title" className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-3">
                {profile.displayName}
              </h2>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                  Level {profile.level}: {profile.levelName}
                </span>
                {profile.rank && (
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-full">
                    Rank #{profile.rank}
                  </span>
                )}
              </div>

              {/* Bio */}
              <div className="w-full border-t border-zinc-100 dark:border-zinc-800/80 my-4 pt-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">
                  {profile.bio || 'This member has not written a bio yet.'}
                </p>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2 mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-4 py-2 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-semibold">
                <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Longest Active Streak: {profile.longestStreak} Days
              </div>

              {/* Earned Badges */}
              <div className="w-full text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                  Earned Badges ({profile.badgeSlugs.length})
                </h3>
                
                {profile.badgeSlugs.length === 0 ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-600 italic">No badges earned yet.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-4" role="list" aria-label="Earned badges">
                    {profile.badgeSlugs.map((slug) => {
                      const badge = BADGE_MAP.get(slug as BadgeSlug);
                      if (!badge) return null;
                      return (
                        <div
                          key={slug}
                          role="listitem"
                          className="flex flex-col items-center text-center group relative cursor-pointer"
                        >
                          <div
                            aria-label={`Badge: ${badge.name}. Criteria: ${badge.description}`}
                            className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700/50 text-2xl hover:scale-105 transition-transform"
                          >
                            {badge.icon}
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-950 text-white text-xs p-2 rounded-lg shadow-xl z-20 text-center pointer-events-none">
                            <p className="font-bold">{badge.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{badge.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
